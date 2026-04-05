import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useIngredientsStore } from './ingredients'
import { recipeIngredientsManager } from '@/services/recipe_ingredients_manager'
import { v7 as uuidv7 } from 'uuid'
import type { RecipeIngredient, Ingredient, UUID } from '@/types'

export const useRecipeIngredientsStore = defineStore('recipeIngredients', () => {
  const ingredientsStore = useIngredientsStore()

  const all = ref<RecipeIngredient[]>([])

  async function init() {
    all.value = await recipeIngredientsManager.getAll()
  }

  async function add(recipeIngredient: RecipeIngredient): Promise<UUID | undefined> {
    const newId = await recipeIngredientsManager.add(recipeIngredient)
    if (newId) {
      all.value.push(recipeIngredient)
      return newId
    }
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
