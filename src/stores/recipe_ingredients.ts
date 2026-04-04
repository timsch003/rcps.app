import { defineStore } from 'pinia'
import { ref } from 'vue'
import { db } from '@/services/dexie'
import { useIngredientsStore } from './ingredients'
import { v7 as uuidv7 } from 'uuid'
import type { RecipeIngredient, Ingredient, UUID } from '@/types'

export const useRecipeIngredientsStore = defineStore('recipeIngredients', () => {
  const ingredientsStore = useIngredientsStore()

  const all = ref<RecipeIngredient[]>([])

  async function init() {
    all.value = await db.recipe_ingredients.toArray()
  }

  async function add(recipeIngredient: RecipeIngredient): Promise<UUID | undefined> {
    let recipeIngredientId: UUID | undefined

    const existsinStore = all.value.find(
      (ri) => ri.id === recipeIngredient.id && ri.recipeId === recipeIngredient.recipeId,
    )

    if (existsinStore) return undefined

    const existsInDb = await db.recipe_ingredients
      .where({
        id: recipeIngredient.id,
        recipeId: recipeIngredient.recipeId,
      })
      .first()

    if (existsInDb) return undefined

    try {
      recipeIngredientId = await db.recipe_ingredients.add(recipeIngredient)
      all.value.push(recipeIngredient)
    } catch (error) {
      console.error('Failed to add recipe ingredient to the local database:', error)
    }

    return recipeIngredientId
  }

  async function addManyByIngredientId(recipeId: UUID, ingredientIds: UUID[]): Promise<UUID[]> {
    const promises = ingredientIds.map(async (ingredientId, index) => {
      const newRecipeIngredient: RecipeIngredient = {
        id: uuidv7(),
        recipeId: recipeId,
        ingredientId: ingredientId,
        sortOrder: index * 100,
      }

      return await add(newRecipeIngredient)
    })

    const results = await Promise.all(promises)

    return results.filter((id): id is UUID => id !== undefined)
  }

  function getIngredientsByRecipeId(
    recipeId: string,
  ): ((RecipeIngredient & Pick<Ingredient, 'name'>) | undefined)[] | undefined {
    const recipeIngredients = all.value.filter((ri) => ri.recipeId === recipeId)
    if (!recipeIngredients) return undefined
    return recipeIngredients.map((ri) => {
      const name = ingredientsStore.getName(ri.ingredientId)
      if (!name) return undefined
      const intersection = ri as RecipeIngredient & Pick<Ingredient, 'name'>
      intersection.name = name
      return intersection
    })
  }

  return {
    all,
    init,
    add,
    addManyByIngredientId,
    getIngredientsByRecipeId,
  }
})
