import { ref } from 'vue'
import { defineStore } from 'pinia'
import { useLastViewedStore } from '@/stores/last_viewed'
import { MAX_TOTAL_CACHE_SIZE } from '@/constants'
import type { RecipeLocal } from '@/types'

export const useRecipesStore = defineStore('recipes', () => {
  const lastViewedStore = useLastViewedStore()
  const favorites = ref<RecipeLocal[]>([])
  const lastViewed = ref<RecipeLocal[]>([])
  const tagged = ref<RecipeLocal[]>([])
  const cachedTagId = ref<string>('')

  function populateLastViewedCache(recipes: RecipeLocal[]): void {
    lastViewed.value = recipes
  }

  function cacheFavorites(recipes: RecipeLocal[]): void {
    if (getRemainingCacheSize() < recipes.length) {
      favorites.value = []
      return
    }

    favorites.value = sortByCreated(recipes)
  }

  function cacheTagged(tagId: string, recipes: RecipeLocal[]): void {
    if (getRemainingCacheSize() < recipes.length) {
      tagged.value = []
      cachedTagId.value = ''
      return
    }

    tagged.value = sortByName(recipes)
    cachedTagId.value = tagId
  }

  function getRemainingCacheSize(): number {
    const currentCacheSize = lastViewed.value.length + favorites.value.length + tagged.value.length
    return MAX_TOTAL_CACHE_SIZE - currentCacheSize
  }

  function sortByCreated(recipes: RecipeLocal[]): RecipeLocal[] {
    return recipes.sort((a, b) => {
      const timeA = BigInt('0x' + a.id.replace(/-/g, '').slice(0, 12))
      const timeB = BigInt('0x' + b.id.replace(/-/g, '').slice(0, 12))
      return timeA > timeB ? 1 : timeA < timeB ? -1 : 0
    })
  }

  function sortByName(recipes: RecipeLocal[]): RecipeLocal[] {
    return recipes.sort((a, b) => a.name.localeCompare(b.name))
  }

  function removeCached(recipeId: RecipeLocal['id']): void {
    favorites.value = favorites.value.filter((recipe) => recipe.id !== recipeId)
    tagged.value = tagged.value.filter((recipe) => recipe.id !== recipeId)
    lastViewed.value = lastViewed.value.filter((recipe) => recipe.id !== recipeId)
    lastViewedStore.removeEntry(recipeId)
  }

  return {
    favorites,
    lastViewed,
    tagged,
    cachedTagId,
    cacheFavorites,
    cacheTagged,
    populateLastViewedCache,
    removeCached,
    getRemainingCacheSize,
    sortByCreated,
    sortByName,
  }
})
