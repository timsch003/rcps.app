import { db } from '@/adapters/dexie'
import { useRecipesStore } from '@/stores/recipes'
import { ingredientsManager } from './ingredients_manager'
import { tagsManager } from './tags_manager'
import { v7 as uuidv7 } from 'uuid'
import { sync } from './sync'
import type { RecipeLocal, RecipeRaw, Tag, UUID } from '@/types'

async function createEdit(
  data: RecipeRaw,
  editingRecipeId?: UUID,
): Promise<RecipeLocal['id'] | undefined> {
  const newRecipeId = editingRecipeId || uuidv7()

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
    data.matchedIngredients.map(async (mi) => {
      return await ingredientsManager.addRecipeIngredient(newRecipeId, mi)
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

  await db.recipes.put(newRecipe)
  updateCaches(newRecipe)
  void sync.trigger()
  return newRecipe.id
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

export const recipesManager = {
  createEdit,
  getById,
  getFavorites,
  getLastViewed,
  getTagged,
  nameExists,
  updateCaches,
}
