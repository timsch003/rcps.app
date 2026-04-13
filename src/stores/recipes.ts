import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { RecipeLocal } from '@/types'

const MAX_TOTAL_CACHE_SIZE = 1000
const MAX_LAST_VIEWED_CACHE_SIZE = 100
const KEEP_LAST_VIEWED_UNTIL_INDEX = MAX_LAST_VIEWED_CACHE_SIZE / 2 - 1

export const useRecipesStore = defineStore('recipes', () => {
  const favorites = ref<RecipeLocal[]>([])
  const lastViewed = ref<RecipeLocal[]>([])
  const tagged = ref<RecipeLocal[]>([])

  function cacheViewed(recipe: RecipeLocal): void {
    // Remove the recipe if it already exists to avoid
    // duplicates and ensure the most recent view is at the front.
    const existingIndex = lastViewed.value.findIndex((r) => r.id === recipe.id)
    if (existingIndex !== -1) lastViewed.value.splice(existingIndex, 1)

    if (lastViewed.value.length >= MAX_LAST_VIEWED_CACHE_SIZE)
      lastViewed.value.splice(KEEP_LAST_VIEWED_UNTIL_INDEX)

    lastViewed.value.unshift(recipe)
  }

  function cacheFavorite(recipe: RecipeLocal): void {
    if (favorites.value.some((r) => r.id === recipe.id)) return
    if (getRemainingCacheSize() <= 0) return
    favorites.value.unshift(recipe)
  }

  function cacheTagged(recipes: RecipeLocal[]): void {
    if (getRemainingCacheSize() < recipes.length) return
    tagged.value = recipes
  }

  function getRemainingCacheSize(): number {
    const currentCacheSize = lastViewed.value.length + favorites.value.length + tagged.value.length
    return MAX_TOTAL_CACHE_SIZE - currentCacheSize
  }

  return {
    favorites,
    lastViewed,
    tagged,
    cacheFavorite,
    cacheTagged,
    cacheViewed,
    getRemainingCacheSize,
  }
})
