import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { RecipeLocal } from '@/types'

const MAX_CACHE_SIZE = 500
const KEEP_LAST_VIEWED_COUNT = 10

export const useRecipesStore = defineStore('recipes', () => {
  const lastViewed = ref<RecipeLocal[]>([])
  const favorites = ref<RecipeLocal[]>([])

  function cacheViewed(recipe: RecipeLocal): void {
    if (lastViewed.value.some((r) => r.id === recipe.id)) return
    lastViewed.value.unshift(recipe)
    handleCacheSize()
  }

  function cacheFavorite(recipe: RecipeLocal): void {
    if (favorites.value.some((r) => r.id === recipe.id)) return
    if (favorites.value.length >= MAX_CACHE_SIZE - KEEP_LAST_VIEWED_COUNT) return
    favorites.value.unshift(recipe)
    handleCacheSize()
  }

  function emptyLastViewedCache(): void {
    lastViewed.value = lastViewed.value.slice(0, KEEP_LAST_VIEWED_COUNT - 1)
  }

  function handleCacheSize(): void {
    const allCachedCount = [...lastViewed.value, ...favorites.value].length
    if (allCachedCount >= MAX_CACHE_SIZE) emptyLastViewedCache()
  }

  return {
    lastViewed,
    favorites,
    cacheViewed,
    cacheFavorite,
    emptyLastViewedCache,
  }
})
