import { watch, onUnmounted } from 'vue'
import { useRecipesStore } from '@/stores/recipes'
import { useSyncStore } from '@/stores/sync'
import { useAuthStore } from '@/stores/auth'
import { useOnlineStatus } from './useOnlineStatus'
import { useRealtimeSync } from './useRealtimeSync'
import { getOrCreateDeviceId } from '@/utils/uuid'
import {
  syncRecipe as pbSyncRecipe,
  deleteRecipe as pbDeleteRecipe,
  syncRecipesBatch,
  ClientResponseError,
} from '@/services/pocketbase'
import { saveToDb, deleteFromDb } from '@/services/dexie'
import type { RecipeLocal } from '@/types'

/**
 * Sync manager orchestrator
 * Coordinates recipe syncing, conflict resolution, and realtime updates
 */
export function useSyncManager() {
  const recipesStore = useRecipesStore()
  const syncStore = useSyncStore()
  const authStore = useAuthStore()
  const { isOnline } = useOnlineStatus()
  const { setupRealtimeSync, cleanupRealtimeSync } = useRealtimeSync()
  const deviceId = getOrCreateDeviceId()

  // Watch for online status changes
  watch(
    () => isOnline.value,
    async (online: boolean) => {
      if (online) {
        await reconcileAfterOffline()
        // Resubscribe to realtime when coming back online
        await setupRealtimeSync()
      } else {
        // Unsubscribe when going offline
        await cleanupRealtimeSync()
      }
    },
  )

  /**
   * Sync a single recipe
   */
  async function syncRecipe(recipeId: string) {
    const recipesList = recipesStore.recipes as RecipeLocal[]
    const recipe = recipesList.find((r) => r.id === recipeId)
    if (!recipe) {
      syncStore.addSyncError(recipeId, 'Recipe not found')
      return
    }

    if (!isOnline.value) {
      syncStore.addSyncError(recipeId, 'Offline: changes will sync when back online')
      return
    }

    syncStore.setSyncProgress(1, 1, recipeId, 'processing')

    try {
      // Sync to remote
      const result = await pbSyncRecipe({
        ...recipe,
        device_id: deviceId,
      })

      if (result.success && result.data) {
        const synced: RecipeLocal = {
          ...result.data,
          synced: true,
          pending_sync: false,
          conflict_detected: false,
          retry_count: 0,
        }

        await saveToDb(synced)
        await recipesStore.loadRecipesFromDB(authStore.user!.id)
        syncStore.clearSyncError(recipeId)
        syncStore.setSyncProgress(1, 1, recipeId, 'completed')
      } else {
        throw new Error(result.error || 'Sync failed')
      }

      await syncStore.recordSyncTime()
    } catch (e: any) {
      const errorMsg = e instanceof ClientResponseError 
        ? `${e.status}: ${e.message}` 
        : (e.message || 'Sync failed')
      syncStore.addSyncError(recipeId, errorMsg)
      syncStore.setSyncProgress(1, 1, recipeId, 'failed')

      const recipesList = recipesStore.recipes as RecipeLocal[]
      const recipe = recipesList.find((r) => r.id === recipeId)
      if (recipe) {
        recipe.sync_error = errorMsg
        recipe.retry_count = (recipe.retry_count || 0) + 1
      }

      console.error(`Failed to sync ${recipeId}:`, e)
    } finally {
      syncStore.clearSyncProgress()
    }
  }

  /**
   * Batch sync multiple recipes using PocketBase batch API
   */
  async function syncBatch(recipeIds: string[]) {
    if (recipeIds.length === 0) return

    syncStore.state = 'syncing_batch'
    syncStore.setSyncProgress(0, recipeIds.length, '', 'processing')

    const recipesList = recipesStore.recipes as RecipeLocal[]
    const recipesToSync = recipesList.filter((r) => recipeIds.includes(r.id))

    try {
      // Use batch API for better performance
      const result = await syncRecipesBatch(recipesToSync)

      if (result.success) {
        // Update local records with sync status
        for (let i = 0; i < result.results.length; i++) {
          const batchResult = result.results[i]!
          const recipe = recipesToSync[i]!
          
          if (batchResult.success && batchResult.data) {
            await saveToDb({
              ...batchResult.data,
              synced: true,
              pending_sync: false,
              local_only: false,
              retry_count: 0,
            })
            syncStore.clearSyncError(recipe.id)
          } else {
            syncStore.addSyncError(recipe.id, batchResult.error || 'Sync failed')
            recipe.retry_count = (recipe.retry_count || 0) + 1
          }
          syncStore.setSyncProgress(i + 1, recipesToSync.length, recipe.id, 'completed')
        }
        await recipesStore.loadRecipesFromDB(authStore.user!.id)
      }
    } catch (e) {
      // Network or other errors - mark all as failed
      const errorMsg = e instanceof ClientResponseError 
        ? `${e.status}: ${e.message}` 
        : (e instanceof Error ? e.message : 'Sync failed')

      for (const recipe of recipesToSync) {
        syncStore.addSyncError(recipe.id, errorMsg)
        recipe.retry_count = (recipe.retry_count || 0) + 1
      }
      console.error('Batch sync failed:', e)
    } finally {
      syncStore.state = 'idle'
      syncStore.clearSyncProgress()
    }
  }

  /**
   * Delete recipe with sync
   */
  async function deleteRecipe(recipeId: string) {
    try {
      const result = await pbDeleteRecipe(recipeId)
      if (!result.success) {
        throw new Error(result.error || 'Delete failed')
      }

      await deleteFromDb(recipeId)
      await recipesStore.loadRecipesFromDB(authStore.user!.id)
      syncStore.clearSyncError(recipeId)
    } catch (e: any) {
      const errorMsg = e instanceof ClientResponseError 
        ? `${e.status}: ${e.message}` 
        : (e.message || 'Delete failed')
      syncStore.addSyncError(recipeId, errorMsg)
      console.error(`Failed to delete ${recipeId}:`, e)
    }
  }

  /**
   * Sync all pending changes
   */
  async function syncAll() {
    const unsynced = recipesStore.unsyncedRecipes
    if (unsynced.length === 0) return

    await syncBatch(unsynced.map((r) => r.id))
  }

  /**
   * Full reconciliation after coming back online
   */
  async function reconcileAfterOffline() {
    if (!isOnline.value || !authStore.user?.id) return

    syncStore.state = 'reconciling'

    try {
      // Sync any pending local changes first
      const unsynced = recipesStore.unsyncedRecipes
      if (unsynced.length > 0) {
        await syncBatch(unsynced.map((r) => r.id))
      }

      await syncStore.recordSyncTime()
      syncStore.state = 'idle'
    } catch (e: any) {
      syncStore.lastError = `Reconciliation failed: ${e.message}`
      syncStore.state = 'error'
      console.error('Reconciliation failed:', e)
    }
  }

  onUnmounted(() => {
    cleanupRealtimeSync()
  })

  return {
    syncRecipe,
    syncBatch,
    deleteRecipe,
    syncAll,
    reconcileAfterOffline,
    setupRealtimeSync,
    cleanupRealtimeSync,
  }
}
