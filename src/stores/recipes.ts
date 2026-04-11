import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { RecipeLocal } from '@/types'

export const useRecipesStore = defineStore('recipes', () => {
  const cached = ref<RecipeLocal[]>([])

  function cache(recipe: RecipeLocal): void {
    if (cached.value.some((r) => r.id === recipe.id)) return
    cached.value.push(recipe)
  }

  return {
    cached,
    cache,
  }
})
