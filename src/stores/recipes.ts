import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { db, deleteFromDb, getDbStats, saveToDbValidated } from '@/services/dexie'
import { getOrCreateDeviceId, generateUuid } from '@/utils/uuid'
import type { RecipeLocal, ValidationError } from '@/types'

export const useRecipesStore = defineStore('recipes', () => {
  const recipes = ref<Map<string, RecipeLocal>>(new Map())
  const syncing = ref(false)
  const lastError = ref<string | null>(null)
  const validationErrors = ref<Map<string, ValidationError[]>>(new Map())
  const dbStats = ref<any>(null)
  const deviceId = getOrCreateDeviceId()

  const localRecipes = computed(() => Array.from(recipes.value.values()))
  const unsyncedRecipes = computed(() =>
    localRecipes.value.filter((r) => r.pending_sync || r.sync_error),
  )
  const conflictedRecipes = computed(() => localRecipes.value.filter((r) => r.conflict_detected))
  const errorRecipes = computed(() => localRecipes.value.filter((r) => r.sync_error))

  async function loadRecipesFromDB(userId: string) {
    const stored = await db.recipes.where('userId').equals(userId).toArray()
    const map = new Map(stored.map((r) => [r.id, r]))
    recipes.value = map
    await updateDBStats()
  }

  async function updateRecipe(id: string, updates: Partial<RecipeLocal>) {
    const recipe = recipes.value.get(id)
    if (!recipe) {
      lastError.value = 'Recipe not found'
      return
    }

    const updated: RecipeLocal = {
      ...recipe,
      ...updates,
      updated: Date.now(),
      pending_sync: true,
      synced: false,
      retry_count: 0,
      device_id: deviceId,
    }

    // Validate
    const result = await saveToDbValidated(updated)
    if (result.errors.length > 0) {
      validationErrors.value.set(id, result.errors)
      lastError.value = `Validation failed: ${result.errors[0].message}`
      return
    }

    validationErrors.value.delete(id)
    recipes.value.set(id, updated)
  }

  async function createRecipe(
    recipe: Omit<
      RecipeLocal,
      | 'id'
      | 'updated'
      | 'device_id'
      | 'synced'
      | 'pending_sync'
      | 'local_only'
      | 'conflict_detected'
      | 'retry_count'
    >,
  ) {
    const id = generateUuid()
    const newRecipe: RecipeLocal = {
      ...recipe,
      id,
      updated: Date.now(),
      pending_sync: true,
      synced: false,
      local_only: true,
      conflict_detected: false,
      retry_count: 0,
      device_id: deviceId,
    }

    // Validate
    const result = await saveToDbValidated(newRecipe)
    if (result.errors.length > 0) {
      validationErrors.value.set(id, result.errors)
      lastError.value = `Validation failed: ${result.errors[0].message}`
      return null
    }

    validationErrors.value.delete(id)
    recipes.value.set(id, newRecipe)
    return newRecipe
  }

  async function deleteRecipe(id: string) {
    recipes.value.delete(id)
    await deleteFromDb(id)
    validationErrors.value.delete(id)
  }

  async function updateDBStats() {
    dbStats.value = await getDbStats()
  }

  function clearErrors() {
    lastError.value = null
    validationErrors.value.clear()
  }

  return {
    recipes: localRecipes,
    unsyncedRecipes,
    conflictedRecipes,
    errorRecipes,
    syncing,
    lastError,
    validationErrors,
    dbStats,
    deviceId,
    loadRecipesFromDB,
    updateRecipe,
    createRecipe,
    deleteRecipe,
    updateDBStats,
    clearErrors,
  }
})
