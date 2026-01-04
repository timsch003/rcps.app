import { watch } from 'vue'
import { useRecipesStore } from '@/stores/recipes'
import { useSyncStore } from '@/stores/sync'
import { useAuthStore } from '@/stores/auth'
import { useOnlineStatus } from './useOnlineStatus'
import { getOrCreateDeviceId } from '@/utils/uuid'
import {
  syncRecipe as pbSyncRecipe,
  deleteRecipe as pbDeleteRecipe,
  fetchUserRecipes,
} from '@/services/pocketbase'
import { db, saveToDb, deleteFromDb } from '@/services/dexie'
import { executeWithRetry, DEFAULT_RETRY_CONFIG } from '@/services/retryStrategy'
import type { RecipeLocal } from '@/types'

export function useSyncManager() {
  const recipesStore = useRecipesStore()
  const syncStore = useSyncStore()
  const authStore = useAuthStore()
  const { isOnline } = useOnlineStatus()
  const deviceId = getOrCreateDeviceId()

  // Watch for online status changes
  watch(
    () => isOnline.value,
    async (online) => {
      if (online) {
        await reconcileAfterOffline()
      }
    },
  )

  // Watch for auto-sync trigger
  function setupAutoSyncListener() {
    window.addEventListener('auto-sync-trigger', async () => {
      const unsynced = recipesStore.unsyncedRecipes
      if (unsynced.length > 0) {
        await syncBatch(unsynced.map((r) => r.id))
      }
    })
  }

  /**
   * Sync a single recipe with retry logic
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
      await executeWithRetry(
        async () => {
          // Fetch latest from remote
          const remoteRecipes = await fetchUserRecipes(authStore.user!.id)
          const remoteVersion = remoteRecipes.find((r) => r.id === recipeId)

          if (remoteVersion && remoteVersion.updated > recipe.updated) {
            // Conflict detected
            syncStore.state = 'conflict'
            const resolution = await syncStore.resolveConflict(
              recipeId,
              recipe,
              remoteVersion,
              recipe._original,
            )

            // Update local with resolved version
            const updated: RecipeLocal = {
              ...resolution.resolved,
              synced: true,
              pending_sync: false,
              conflict_detected: resolution.conflicts.length > 0,
              retry_count: 0,
            }

            await saveToDb(updated)
            await recipesStore.loadRecipesFromDB(authStore.user!.id)

            syncStore.setSyncProgress(1, 1, recipeId, 'completed')
            return
          }

          // No conflict, sync to remote
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
          } else {
            throw new Error(result.error || 'Sync failed')
          }
        },
        DEFAULT_RETRY_CONFIG,
        (attempt, delay, error) => {
          const recipesList = recipesStore.recipes as RecipeLocal[]
          const recipe = recipesList.find((r) => r.id === recipeId)
          if (recipe) {
            recipe.retry_count = attempt
            recipe.last_retry = Date.now()
            recipe.sync_error = error.message
          }
          console.log(`Retry ${attempt} for ${recipeId} in ${delay}ms:`, error.message)
        },
      )

      await syncStore.recordSyncTime()
      syncStore.setSyncProgress(1, 1, recipeId, 'completed')
    } catch (e: any) {
      const errorMsg = e.message || 'Sync failed'
      syncStore.addSyncError(recipeId, errorMsg)
      syncStore.setSyncProgress(1, 1, recipeId, 'failed')

      const recipesList = recipesStore.recipes as RecipeLocal[]
      const recipe = recipesList.find((r) => r.id === recipeId)
      if (recipe) {
        recipe.sync_error = errorMsg
      }

      console.error(`Failed to sync ${recipeId}:`, e)
    } finally {
      syncStore.clearSyncProgress()
    }
  }

  /**
   * Batch sync multiple recipes
   */
  async function syncBatch(recipeIds: string[]) {
    if (recipeIds.length === 0) return

    syncStore.state = 'syncing_batch'
    syncStore.setSyncProgress(0, recipeIds.length, '', 'processing')

    for (let i = 0; i < recipeIds.length; i++) {
      await syncRecipe(recipeIds[i])
      syncStore.setSyncProgress(i + 1, recipeIds.length, recipeIds[i], 'processing')

      // Small delay between syncs to avoid overwhelming server
      if (i < recipeIds.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 100))
      }
    }

    syncStore.state = 'idle'
    syncStore.clearSyncProgress()
  }

  /**
   * Delete recipe with retry
   */
  async function deleteRecipe(recipeId: string) {
    try {
      await executeWithRetry(async () => {
        const result = await pbDeleteRecipe(recipeId)
        if (!result.success) {
          throw new Error(result.error || 'Delete failed')
        }
      }, DEFAULT_RETRY_CONFIG)

      await deleteFromDb(recipeId)
      await recipesStore.loadRecipesFromDB(authStore.user!.id)
      syncStore.clearSyncError(recipeId)
    } catch (e: any) {
      syncStore.addSyncError(recipeId, e.message)
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
    if (!isOnline.value) return

    syncStore.state = 'reconciling'

    try {
      const userId = authStore.user!.id
      const local = await db.recipes.where('userId').equals(userId).toArray()
      const remote = await fetchUserRecipes(userId)

      // Process all local recipes
      for (const localRecipe of local) {
        const remoteVersion = remote.find((r) => r.id === localRecipe.id)

        if (remoteVersion) {
          // Recipe exists on both sides
          if (remoteVersion.updated > localRecipe.updated && !localRecipe.pending_sync) {
            // Remote is newer and we didn't change it → use remote
            await saveToDb({ ...remoteVersion, synced: true, pending_sync: false })
          } else if (localRecipe.pending_sync) {
            // We have pending changes → sync them
            await syncRecipe(localRecipe.id)
          }
        } else if (localRecipe.pending_sync) {
          // Local recipe not on server → sync it
          await syncRecipe(localRecipe.id)
        }
      }

      // Check for remote recipes we don't have locally
      for (const remoteRecipe of remote) {
        if (!local.find((r) => r.id === remoteRecipe.id)) {
          await saveToDb({
            ...remoteRecipe,
            synced: true,
            pending_sync: false,
            conflict_detected: false,
            retry_count: 0,
          })
        }
      }

      await recipesStore.loadRecipesFromDB(userId)
      await syncStore.recordSyncTime()
      syncStore.state = 'idle'
    } catch (e: any) {
      syncStore.lastError = `Reconciliation failed: ${e.message}`
      syncStore.state = 'error'
      console.error('Reconciliation failed:', e)
    }
  }

  return {
    syncRecipe,
    syncBatch,
    deleteRecipe,
    syncAll,
    reconcileAfterOffline,
    setupAutoSyncListener,
  }
}
