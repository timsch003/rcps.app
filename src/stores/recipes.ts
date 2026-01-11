import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { db, addRecipe, deleteRecipe } from '@/services/dexie'
import { getOrCreateDeviceId, generateUuid } from '@/utils/uuid'
import type { RecipeLocal } from '@/types'

export const useRecipesStore = defineStore('recipes', () => {
  const recipes = ref<Map<string, RecipeLocal>>(new Map())
  const syncing = ref(false)
  const deviceId = getOrCreateDeviceId()

  const localRecipes = computed(() => Array.from(recipes.value.values()))
  const unsyncedRecipes = computed(() => localRecipes.value.filter((r) => r.pendingSync))

  async function loadLocal(userId: string) {
    const stored = await db.recipes.where('userId').equals(userId).toArray()
    const map = new Map(stored.map((r) => [r.id, r]))
    recipes.value = map
  }

  async function update(id: string, updates: Partial<RecipeLocal>) {
    const recipe = recipes.value.get(id)
    if (!recipe) {
      return
    }

    const updated: RecipeLocal = {
      ...recipe,
      ...updates,
      updated: Date.now(),
      pendingSync: true,
      synced: false,
    }

    recipes.value.set(id, updated)
  }

  async function add(recipe: Omit<RecipeLocal, 'id' | 'updated' | 'synced' | 'pendingSync'>) {
    const id = generateUuid()
    const newRecipe: RecipeLocal = {
      ...recipe,
      id,
      updated: Date.now(),
      pendingSync: true,
      synced: false,
    }

    recipes.value.set(id, newRecipe)
    await addRecipe(newRecipe)
  }

  async function remove(id: string) {
    recipes.value.delete(id)
    await deleteRecipe(id)
  }

  return {
    recipes: localRecipes,
    unsyncedRecipes,
    syncing,
    deviceId,
    loadLocal,
    update,
    add,
    remove,
  }
})
