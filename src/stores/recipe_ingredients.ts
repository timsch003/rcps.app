import { defineStore } from 'pinia'
import { ref } from 'vue'
import { db } from '@/services/dexie'
import { useIngredientsStore } from './ingredients'
import type { RecipeIngredient, Ingredient, Recipe } from '@/types'

export const useRecipeIngredientsStore = defineStore('recipeIngredients', () => {
  const ingredientsStore = useIngredientsStore()

  const all = ref<RecipeIngredient[]>([])

  async function init() {
    all.value = await db.recipe_ingredients.toArray()
  }

  async function add(recipeIngredient: RecipeIngredient) {
    const existsinStore = !!all.value.find(
      (ri) => ri.id === recipeIngredient.id && ri.recipeId === recipeIngredient.recipeId,
    )
    if (existsinStore) return
    all.value.push(recipeIngredient)

    const existsInDb = !!(await db.recipe_ingredients
      .where({
        id: recipeIngredient.id,
        recipeId: recipeIngredient.recipeId,
      })
      .first())
    if (existsInDb) return
    try {
      await db.recipe_ingredients.add(recipeIngredient)
    } catch (error) {
      console.error('Failed to add recipe ingredient to the local database:', error)
    }
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
    getIngredientsByRecipeId,
  }
})
