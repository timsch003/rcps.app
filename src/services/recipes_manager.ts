import { db } from '@/adapters/dexie'
import { useRecipesStore } from '@/stores/recipes'
import { ingredientsManager } from './ingredients_manager'
import { tagsManager } from './tags_manager'
import { v7 as uuidv7 } from 'uuid'
import { sync } from './sync'
import { unitsManager } from './units_manager'
import { limitDecimals } from '@/utils/conversion'
import { dashes } from '@/utils/fixed_values'
import { t } from '@/lang/i18n'
import type { RecipeLocal, RecipeRaw, RecipeIngredient, Tag, UUID } from '@/types'

async function addNew(data: RecipeRaw): Promise<RecipeLocal['id'] | undefined> {
  const newRecipeId = uuidv7()

  let tagIds: UUID[] = []
  if (Array.isArray(data.tags)) {
    tagIds = await Promise.all(
      data.tags.map(async (tag) => {
        const id = await tagsManager.addOrGetExisting(tag)
        return id
      }),
    ).then((ids) => ids.filter((id): id is UUID => !!id))
  }

  const recipeIngredientIds: UUID[] = await Promise.all(
    data.matchedIngredients.map(async (mi, index) => {
      return await ingredientsManager.addRecipeIngredient(newRecipeId, mi, index)
    }),
  ).then((ids) => ids.filter((id): id is UUID => !!id))

  const newRecipe: RecipeLocal = {
    id: newRecipeId,
    name: data.name!,
    tagIds: tagIds,
    favorite: data.favorite,
    servings: data.servings || 1,
    recipeIngredientIds: recipeIngredientIds,
    instructions: data.instructions,
    notes: data.notes,
    synced: false,
  }

  await db.recipes.add(newRecipe)
  updateCaches(newRecipe)
  sync.pushLocalChanges()
  return newRecipe.id
}

async function editExisting(
  recipeId: RecipeLocal['id'],
  data: RecipeRaw,
): Promise<RecipeLocal['id'] | undefined> {
  const existingRecipe = await db.recipes.get(recipeId)
  if (!existingRecipe) return undefined

  const normalizedTags = normalizeTags(data.tags)
  const tagIds = await resolveTagIds(normalizedTags)
  const previousRecipeIngredientIds = existingRecipe.recipeIngredientIds || []

  const recipeIngredientIds: UUID[] = await Promise.all(
    data.matchedIngredients.map(async (mi, index) => {
      return await ingredientsManager.addRecipeIngredient(recipeId, mi, index)
    }),
  ).then((ids) => ids.filter((id): id is UUID => !!id))

  if (previousRecipeIngredientIds.length) {
    await db.recipe_ingredients.bulkDelete(previousRecipeIngredientIds)
  }

  const updatedRecipe: RecipeLocal = {
    ...existingRecipe,
    name: data.name,
    tagIds,
    favorite: data.favorite,
    servings: data.servings || 1,
    recipeIngredientIds,
    instructions: data.instructions,
    notes: data.notes,
    deletedRecipeIngredientIds: [
      ...(existingRecipe.deletedRecipeIngredientIds || []),
      ...previousRecipeIngredientIds,
    ],
    synced: false,
  }

  await db.recipes.put(updatedRecipe)
  await updateCaches(updatedRecipe)
  sync.pushLocalChanges()
  return updatedRecipe.id
}

async function getById(recipeId: string): Promise<RecipeLocal | undefined> {
  const recipesStore = useRecipesStore()

  let cached = recipesStore.favorites.find((r) => r.id === recipeId)
  if (!cached) cached = recipesStore.tagged.find((r) => r.id === recipeId)

  const recipe = cached ? cached : await db.recipes.get(recipeId)
  if (recipe) recipesStore.updateLastViewed(recipe)
  return recipe
}

async function getFavorites(): Promise<RecipeLocal[]> {
  const recipesStore = useRecipesStore()

  if (recipesStore.favorites.length > 0) return recipesStore.favorites

  const favorites = await db.recipes.filter((r) => r.favorite).toArray()
  recipesStore.cacheFavorites(favorites)
  return favorites
}

function getLastViewed(): RecipeLocal[] {
  return useRecipesStore().lastViewed
}

async function getTagged(tagId: Tag['id']): Promise<RecipeLocal[]> {
  const recipesStore = useRecipesStore()

  const cached = recipesStore.tagged[0]?.tagIds?.includes(tagId)
  if (cached) return recipesStore.tagged

  const recipes = await db.recipes.where('tagIds').equals(tagId).toArray()
  recipesStore.cacheTagged(tagId, recipes)
  return recipes
}

async function nameExists(name: string): Promise<boolean> {
  const existingCached = useRecipesStore().lastViewed.find(
    (r) => r.name.toLowerCase() === name.toLowerCase(),
  )
  if (existingCached) return true

  const existingDb = await db.recipes.where('name').equalsIgnoreCase(name).first()
  return !!existingDb
}

async function nameExistsExcluding(name: string, recipeId: RecipeLocal['id']): Promise<boolean> {
  const existingDb = await db.recipes.where('name').equalsIgnoreCase(name).first()
  return !!existingDb && existingDb.id !== recipeId
}

async function updateCaches(newOrEdited: RecipeLocal): Promise<void> {
  const recipesStore = useRecipesStore()

  replaceRecipe(recipesStore.lastViewed, newOrEdited)

  if (recipesStore.cachedTagId && !newOrEdited.tagIds.includes(recipesStore.cachedTagId)) {
    recipesStore.tagged = recipesStore.tagged.filter((recipe) => recipe.id !== newOrEdited.id)
  }

  if (!newOrEdited.favorite) {
    recipesStore.favorites = recipesStore.favorites.filter((recipe) => recipe.id !== newOrEdited.id)
  }

  if (newOrEdited.tagIds.includes(recipesStore.cachedTagId)) {
    replaceRecipe(recipesStore.tagged, newOrEdited)
    recipesStore.tagged = recipesStore.sortByName(recipesStore.tagged)
  }

  if (newOrEdited.favorite) {
    replaceRecipe(recipesStore.favorites, newOrEdited)
    recipesStore.favorites = recipesStore.sortByCreated(recipesStore.favorites)
  }
}

function replaceRecipe(collection: RecipeLocal[], recipe: RecipeLocal): void {
  const existingIndex = collection.findIndex((item) => item.id === recipe.id)
  if (existingIndex !== -1) collection.splice(existingIndex, 1, recipe)
  else collection.push(recipe)
}

function normalizeTags(tags: string | string[]): string[] {
  return Array.isArray(tags)
    ? tags.map((tag) => tag.trim()).filter((tag) => tag !== '')
    : tags
        .split(',')
        .map((tag) => tag.trim())
        .filter((tag) => tag !== '')
}

async function resolveTagIds(tags: string[]): Promise<UUID[]> {
  return await Promise.all(
    tags.map(async (tag) => {
      const id = await tagsManager.addOrGetExisting(tag)
      return id
    }),
  ).then((ids) => ids.filter((id): id is UUID => !!id))
}

async function getIngStrings(ri: RecipeIngredient): Promise<string[] | undefined> {
  try {
    const ingredientName = await ingredientsManager.getName(ri)

    if (ingredientName === undefined) return undefined
    if (!ri.quantity) return [ingredientName]
    if (ri.quantityUnitPosition === undefined) throw new Error(t('error.no_quantity_position'))

    const stringBefore = ingredientName.substring(0, ri.quantityUnitPosition)
    const quantityString = `${String(limitDecimals(ri.quantity))}${ri.quantityUpper ? dashes[1]! + String(limitDecimals(ri.quantityUpper)) : ''}`
    const stringAfter = ingredientName.substring(ri.quantityUnitPosition)
    const leadingSpace = stringBefore ? ' ' : ''
    const trailingSpace = stringAfter ? ' ' : ''

    if (ri.unitId)
      return [
        stringBefore,
        `${leadingSpace}${quantityString} ${String(unitsManager.getNameById(ri.unitId))}${trailingSpace}`,
        stringAfter,
      ]
    else return [stringBefore, `${leadingSpace}${quantityString}${trailingSpace}`, stringAfter]
  } catch (err) {
    throw err instanceof Error ? err : new Error(String(err))
  }
}

export const recipesManager = {
  addNew,
  editExisting,
  getById,
  getFavorites,
  getLastViewed,
  getTagged,
  nameExists,
  nameExistsExcluding,
  updateCaches,
  getIngStrings,
}
