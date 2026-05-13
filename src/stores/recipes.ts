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
  const cachedTagId = ref<string>('')

  function updateLastViewed(recipe: RecipeLocal): void {
    const existingIndex = lastViewed.value.findIndex((r) => r.id === recipe.id)
    if (existingIndex !== -1) lastViewed.value.splice(existingIndex, 1)

    if (lastViewed.value.length >= MAX_LAST_VIEWED_CACHE_SIZE)
      lastViewed.value.splice(KEEP_LAST_VIEWED_UNTIL_INDEX)

    lastViewed.value.unshift(recipe)
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
  }

  return {
    favorites,
    lastViewed,
    tagged,
    cachedTagId,
    cacheFavorites,
    cacheTagged,
    updateLastViewed,
    removeCached,
    getRemainingCacheSize,
    sortByCreated,
    sortByName,
  }
})
