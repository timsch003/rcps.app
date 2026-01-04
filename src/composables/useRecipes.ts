import { useRecipesStore } from '@/stores/recipes'
import { useAuthStore } from '@/stores/auth'
import { useSyncManager } from './useSyncManager'
import { useOnlineStatus } from './useOnlineStatus'
import { fetchUserRecipes } from '@/services/pocketbase'
import { saveToDb } from '@/services/dexie'
import type { RecipeLocal } from '@/types'
import { onMounted, watch } from 'vue'

export function useRecipes() {
  const recipesStore = useRecipesStore()
  const authStore = useAuthStore()
  const syncManager = useSyncManager()
  const { isOnline } = useOnlineStatus()

  async function initializeRecipes() {
    if (!authStore.user?.id) return

    try {
      // Load from local DB first
      await recipesStore.loadRecipesFromDB(authStore.user.id)

      // If online, fetch from PocketBase and merge
      if (isOnline.value) {
        const remoteRecipes = await fetchUserRecipes(authStore.user.id)

        for (const remote of remoteRecipes) {
          const localMap = new Map(
            Array.from(recipesStore.recipes).map((r: RecipeLocal) => [r.id, r]),
          )
          const local = localMap.get(remote.id)

          if (!local) {
            // Remote recipe we don't have locally
            await saveToDb(remote)
            // Reload to update the store
            await recipesStore.loadRecipesFromDB(authStore.user.id)
          }
        }
      }
    } catch (e: any) {
      recipesStore.lastError = `Failed to initialize recipes: ${e.message}`
    }
  }

  async function editRecipe(id: string, updates: Partial<RecipeLocal>) {
    await recipesStore.updateRecipe(id, updates)

    if (isOnline.value) {
      await syncManager.syncRecipe(id)
    }
  }

  async function addRecipe(
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
    const newRecipe = await recipesStore.createRecipe(recipe)

    if (newRecipe && isOnline.value) {
      await syncManager.syncRecipe(newRecipe.id)
    }

    return newRecipe
  }

  async function removeRecipe(id: string) {
    await recipesStore.deleteRecipe(id)

    if (isOnline.value) {
      await syncManager.deleteRecipe(id)
    }
  }

  // Listen for coming back online
  onMounted(() => {
    window.addEventListener('came-back-online', async () => {
      await syncManager.reconcileAfterOffline()
    })

    syncManager.setupAutoSyncListener()
  })

  return {
    initializeRecipes,
    editRecipe,
    addRecipe,
    removeRecipe,
  }
}
