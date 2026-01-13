import { defineStore } from 'pinia'
import { ref } from 'vue'
import { db } from '@/services/dexie'
import type { RecipeIngredient } from '@/types'

export const useRecipeIngredientsStore = defineStore('recipeIngredients', () => {
  const all = ref<RecipeIngredient[]>([])

  async function init() {
    all.value = await db.recipe_ingredients.toArray()
  }

  async function add(recipeIngredient: RecipeIngredient) {
    all.value.push(recipeIngredient)
    try {
      await db.recipe_ingredients.add(recipeIngredient)
    } catch (error) {
      console.error('Failed to add recipe ingredient to the database:', error)
    }
  }

  return {
    all,
    init,
    add,
  }
})
