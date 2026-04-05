import { db } from '@/adapters/dexie'
import { v7 as uuidv7 } from 'uuid'
import type {
  Ingredient,
  RecipeIngredient,
  MatchedIngredient,
  QuantityUnitText,
  UUID,
} from '@/types'

async function getAll(): Promise<Ingredient[]> {
  return await db.ingredients.toArray()
}

async function add(
  matchedIngredient: MatchedIngredient,
): Promise<RecipeIngredient['id'] | undefined> {
  let ingredient: string
  let ingredientId: UUID

  if (typeof matchedIngredient === 'string') {
    ingredient = matchedIngredient
  } else {
    const selectedIngredient = matchedIngredient.find(
      (qut: QuantityUnitText) => qut.textAfterQuantity && qut.selected,
    )?.textAfterQuantity

    if (typeof selectedIngredient === 'string') ingredient = selectedIngredient
    else {
      console.error("Couldn't extract ingredient name while adding.")
      return undefined
    }
  }

  const existingIngredient = await db.ingredients.where({ name: ingredient }).first()

  if (existingIngredient) {
    ingredientId = existingIngredient.id
  } else {
    try {
      const newIngredient: Ingredient = {
        id: uuidv7(),
        name: ingredient,
      }
      const newIngredientId = await db.ingredients.add(newIngredient)
      ingredientId = newIngredientId
    } catch (error) {
      console.error('Failed to add ingredient to the local database:', error)
      return undefined
    }
  }

  return ingredientId
}

export const ingredientsManager = {
  getAll,
  add,
}
