import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { getOrCreateDeviceId } from '@/utils/uuid'
import { updateSyncMetadata } from '@/services/dexie'
import type { SyncMetadata, SyncState } from '@/types'

export const useSyncStore = defineStore('sync', () => {
  const lastSyncTime = ref(0)
  const isOnline = ref(navigator.onLine)
  const state = ref<SyncState>('synced')
  const deviceId = getOrCreateDeviceId()
  const syncStateReady = computed(() => state.value !== 'syncing')

  async function recordSyncTime() {
    const metadata: SyncMetadata = {
      lastSynced: Date.now(),
      pendingChanges: 0,
    }
    await updateSyncMetadata(metadata)
    lastSyncTime.value = Date.now()
  }

  function resetSyncState() {
    state.value = 'synced'
  }

  return {
    lastSyncTime,
    isOnline,
    state,
    deviceId,
    syncStateReady,
    recordSyncTime,
    resetSyncState,
  }
})
