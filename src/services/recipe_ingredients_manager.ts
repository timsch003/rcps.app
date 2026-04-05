import { db } from '@/adapters/dexie'
import type { RecipeIngredient, UUID } from '@/types'

async function getAll(): Promise<RecipeIngredient[]> {
  return await db.recipe_ingredients.toArray()
}

async function add(recipeIngredient: RecipeIngredient): Promise<UUID | undefined> {
  let recipeIngredientId: UUID | undefined

  const existsinDb = await db.recipe_ingredients
    .where({
      id: recipeIngredient.id,
      recipeId: recipeIngredient.recipeId,
    })
    .first()

  if (existsinDb) return undefined

  try {
    recipeIngredientId = await db.recipe_ingredients.add(recipeIngredient)
  } catch (error) {
    console.error('Failed to add recipe ingredient to the local database:', error)
  }

  return recipeIngredientId
}

export const recipeIngredientsManager = {
  getAll,
  add,
}
