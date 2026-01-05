import { onUnmounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useRecipesStore } from '@/stores/recipes'
import { useSyncStore } from '@/stores/sync'
import { pb } from '@/services/pocketbase'
import { getOrCreateDeviceId } from '@/utils/uuid'
import { db, saveToDb, deleteFromDb } from '@/services/dexie'
import type { RecipeLocal } from '@/types'
import type { RecordSubscription } from 'pocketbase'

/**
 * Realtime sync composable
 * Handles WebSocket subscriptions for instant sync updates
 */
export function useRealtimeSync() {
  const authStore = useAuthStore()
  const recipesStore = useRecipesStore()
  const syncStore = useSyncStore()
  const deviceId = getOrCreateDeviceId()
  let unsubscribe: (() => Promise<void>) | null = null

  /**
   * Setup PocketBase realtime subscriptions for automatic sync
   */
  async function setupRealtimeSync() {
    if (!authStore.user?.id) return

    try {
      // Unsubscribe from previous subscription if any
      if (unsubscribe) {
        await unsubscribe()
      }

      // Subscribe to all recipe changes for this user
      // '*' means subscribe to all records in the collection
      unsubscribe = await pb.collection('recipes').subscribe<RecipeLocal>(
        '*',
        async (data: RecordSubscription<RecipeLocal>) => {
          // Handle realtime changes from server
          const { action, record } = data

          if (record.userId !== authStore.user?.id) return // Ignore other users' recipes

          const recipeId = record.id

          switch (action) {
            case 'create':
            case 'update': {
              // Check if we have this recipe locally
              const local = await db.recipes.get(recipeId)

              if (local) {
                // Conflict detection
                if (local.pendingSync && local.updated > new Date(record.updated).getTime()) {
                  // Local changes are newer and pending - skip remote update
                  console.log(`Skipping remote update for ${recipeId} - local changes pending`)
                  return
                }

                // Resolve conflict if needed
                const remoteRecipe: RecipeLocal = {
                  ...record,
                  updated: new Date(record.updated).getTime(),
                  synced: true,
                  pendingSync: false,
                  localOnly: false,
                  conflictDetected: false,
                  retryCount: 0,
                }

                if (local.updated > remoteRecipe.updated && local.deviceId === deviceId) {
                  // Local is newer and from this device - conflict detected
                  syncStore.addSyncError(recipeId, 'Local changes conflict with remote update')
                } else {
                  // Remote is newer or from different device - use remote
                  const resolution = await syncStore.resolveConflict(
                    recipeId,
                    local,
                    remoteRecipe,
                    local.original,
                  )

                  await saveToDb({
                    ...resolution.resolved,
                    synced: true,
                    pendingSync: false,
                  })
                  await recipesStore.loadRecipesFromDB(authStore.user!.id)
                }
              } else {
                // New recipe from another device - save it locally
                const remoteRecipe: RecipeLocal = {
                  ...record,
                  updated: new Date(record.updated).getTime(),
                  synced: true,
                  pendingSync: false,
                  localOnly: false,
                  conflictDetected: false,
                  retryCount: 0,
                }
                await saveToDb(remoteRecipe)
                await recipesStore.loadRecipesFromDB(authStore.user!.id)
              }
              break
            }

            case 'delete': {
              await deleteFromDb(recipeId)
              await recipesStore.loadRecipesFromDB(authStore.user!.id)
              break
            }
          }
        },
        {
          // Filter to only get recipes for this user
          filter: `userId = "${authStore.user.id}"`,
        },
      )

      console.log('Realtime sync enabled for recipes')
    } catch (e) {
      const errorMsg = e instanceof Error ? e.message : 'Unknown error'
      console.error('Failed to setup realtime sync:', e)
      syncStore.lastError = `Realtime sync failed: ${errorMsg}`
    }
  }

  /**
   * Cleanup realtime subscriptions
   */
  async function cleanupRealtimeSync() {
    if (unsubscribe) {
      await unsubscribe()
      unsubscribe = null
      console.log('Realtime sync disabled')
    }
  }

  onUnmounted(() => {
    cleanupRealtimeSync()
  })

  return {
    setupRealtimeSync,
    cleanupRealtimeSync,
  }
}
