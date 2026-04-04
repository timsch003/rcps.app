import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { updateSyncMetadata, db } from '@/services/dexie'
import { remoteGetRecipes } from '@/services/pocketbase'
import type { SyncMetadata, SyncState, RecipeLocal } from '@/types'

export const useSyncStore = defineStore('sync', () => {
  const lastSync = ref(0)
  const isOnline = ref(navigator.onLine)
  const state = ref<SyncState>('synced')

  async function init() {
    if (isOnline.value && lastSync.value === 0) {
      const recipes = await remoteGetRecipes(useAuthStore().user!.id)
      if (!!recipes.length) {
        db.recipes.bulkAdd(recipes)
        await recordSyncTime()
      }
    }
  }

  async function compareLocalRemote(collection: string, records: RecipeLocal[]) {
    // TODO
  }

  async function recordSyncTime() {
    const metadata: SyncMetadata = {
      lastSync: Date.now(),
      pendingChanges: 0,
    }
    await updateSyncMetadata(metadata)
    lastSync.value = Date.now()
  }

  function resetSyncState() {
    state.value = 'synced'
  }

  return {
    lastSync,
    isOnline,
    state,
    init,
    recordSyncTime,
    resetSyncState,
  }
})
