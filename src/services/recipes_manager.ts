import { db } from '@/adapters/dexie'
import { useRecipesStore } from '@/stores/recipes'
import { ingredientsManager } from './ingredients_manager'
import { tagsManager } from './tags_manager'
import { v7 as uuidv7 } from 'uuid'
import type { RecipeLocal, RecipeRaw, Tag, UUID } from '@/types'

const MAX_CACHE_SIZE = 500

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
    data.matchedIngredients.map(async (mi) => {
      return await ingredientsManager.addRecipeIngredient(newRecipeId, mi)
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
  cache(newRecipe)
  return newRecipe.id
}

function cache(recipe: RecipeLocal): void {
  useRecipesStore().cache(recipe)
}

async function getTagged(tagId: Tag['id']): Promise<RecipeLocal[]> {
  const cachedRecipesWithTag = useRecipesStore().cached.filter((r) => r.tagIds?.includes(tagId))
  if (cachedRecipesWithTag.length) return cachedRecipesWithTag

  const recipes = await db.recipes.where('tagIds').equals(tagId).toArray()

  if (maxCacheSizeExceeded()) useRecipesStore().cached = recipes
  else recipes.forEach((recipe) => cache(recipe))

  return recipes
}

function maxCacheSizeExceeded(): boolean {
  return useRecipesStore().cached.length > MAX_CACHE_SIZE
}

async function getById(recipeId: string): Promise<RecipeLocal | undefined> {
  const cachedRecipe = useRecipesStore().cached.find((r) => r.id === recipeId)
  if (cachedRecipe) return cachedRecipe
  return await db.recipes.get(recipeId)
}

async function nameExists(name: string): Promise<boolean> {
  const existingRecipeInStore = useRecipesStore().cached.find(
    (r) => r.name.toLowerCase() === name.toLowerCase(),
  )
  if (existingRecipeInStore) return true

  const existingRecipeInDb = await db.recipes.where('name').equalsIgnoreCase(name).first()
  return !!existingRecipeInDb
}

export const recipesManager = {
  addNew,
  cache,
  getTagged,
  getById,
  nameExists,
}
