import { db } from '@/adapters/dexie'
import { useRecipesStore } from '@/stores/recipes'
import { ingredientsManager } from './ingredients_manager'
import { tagsManager } from './tags_manager'
import { v7 as uuidv7 } from 'uuid'
import { sync } from './sync'
import type { RecipeLocal, RecipeRaw, Tag, UUID } from '@/types'

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
    servings: data.servings || 1,
    recipeIngredientIds: recipeIngredientIds,
    instructions: data.instructions,
    notes: data.notes,
    synced: false,
  }

  await db.recipes.add(newRecipe)
  sync.pushLocalChanges()
  return newRecipe.id
}

function cacheFavorite(recipe: RecipeLocal): void {
  if (recipe) useRecipesStore().cacheFavorite(recipe)
}

function cacheViewed(recipe: RecipeLocal): void {
  if (recipe) useRecipesStore().cacheViewed(recipe)
}

async function getById(recipeId: string): Promise<RecipeLocal | undefined> {
  const recipesStore = useRecipesStore()

  const cachedRecipe = recipesStore.lastViewed.find((r) => r.id === recipeId)
  if (cachedRecipe) return cachedRecipe

  const recipe = await db.recipes.get(recipeId)
  if (recipe) recipesStore.cacheViewed(recipe)
  return recipe
}

function getFavorites(): RecipeLocal[] {
  return useRecipesStore().favorites
}

function getLastViewed(): RecipeLocal[] {
  return useRecipesStore().lastViewed
}

async function getTagged(tagId: Tag['id']): Promise<RecipeLocal[]> {
  const recipesStore = useRecipesStore()

  const tagAlreadyCached = recipesStore.tagged[0]?.tagIds?.includes(tagId)
  if (tagAlreadyCached) return recipesStore.tagged

  const recipes = await db.recipes.where('tagIds').equals(tagId).toArray()
  recipesStore.cacheTagged(recipes)
  return recipes
}

async function nameExists(name: string): Promise<boolean> {
  const existingRecipeInStore = useRecipesStore().lastViewed.find(
    (r) => r.name.toLowerCase() === name.toLowerCase(),
  )
  if (existingRecipeInStore) return true

  const existingRecipeInDb = await db.recipes.where('name').equalsIgnoreCase(name).first()
  return !!existingRecipeInDb
}

export const recipesManager = {
  addNew,
  cacheFavorite,
  cacheViewed,
  getById,
  getFavorites,
  getLastViewed,
  getTagged,
  nameExists,
}
