import { defineStore } from 'pinia'
import { ref } from 'vue'
import { db } from '@/services/dexie'
import { v7 as uuidv7 } from 'uuid'
import type {
  Ingredient,
  MatchedIngredient,
  QuantityUnitText,
  RecipeIngredient,
  UUID,
} from '@/types'

const STORE_ID = 'ingredients'

export const useIngredientsStore = defineStore(STORE_ID, () => {
  const all = ref<Ingredient[]>([])

  async function init() {
    all.value = await db.ingredients.toArray()
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

    const existsInDb = await db.ingredients.where({ name: ingredient }).first()

    if (existsInDb) {
      all.value.push(existsInDb)
      ingredientId = existsInDb.id
    } else {
      try {
        const newIngredient: Ingredient = {
          id: uuidv7(),
          name: ingredient,
        }
        const newIngredientId = await db.ingredients.add(newIngredient)
        all.value.push(newIngredient)
        ingredientId = newIngredientId
      } catch (error) {
        console.error('Failed to add ingredient to the local database:', error)
        return undefined
      }
    }

    return ingredientId
  }

  function getId(name: Ingredient['name']): Ingredient['id'] | undefined {
    const ingredient = all.value.find((ing) => ing.name === name)
    return ingredient ? ingredient.id : undefined
  }

  function getName(id: Ingredient['id']): Ingredient['name'] | undefined {
    const ingredient = all.value.find((ing) => ing.id === id)
    return ingredient ? ingredient.name : undefined
  }

  return {
    all,
    init,
    add,
    getId,
    getName,
  }
})
