import { defineStore } from 'pinia'
import { ref } from 'vue'
import { sync } from '@/services/sync'
import type { SyncStatus } from '@/types'

const ALLOWED_TRANSITIONS: Record<SyncStatus, SyncStatus[]> = {
  unsynced: ['pushing', 'pulling', 'offline', 'unsynced-offline', 'synced', 'error'],
  'unsynced-offline': ['unsynced', 'offline', 'pulling', 'error'],
  pushing: ['synced', 'error', 'pulling'],
  pulling: ['synced', 'error'],
  synced: ['synced', 'unsynced', 'unsynced-offline', 'pushing', 'pulling', 'offline', 'error'],
  offline: ['unsynced', 'unsynced-offline', 'pulling', 'pushing', 'error'],
  error: ['unsynced', 'unsynced-offline', 'offline', 'pulling', 'pushing'],
}

export const useSyncStore = defineStore('sync', () => {
  const status = ref<SyncStatus>(navigator.onLine ? 'unsynced' : 'offline')

  window.addEventListener('offline', () => {
    setStatus('offline')
  })

  window.addEventListener('online', () => {
    setStatus('unsynced')
    void sync.trigger()
  })

  function setStatus(newStatus: SyncStatus) {
    const allowed = ALLOWED_TRANSITIONS[status.value]
    if (!allowed.includes(newStatus))
      console.warn(`Sync: unexpected transition ${status.value} → ${newStatus}`)
    status.value = newStatus
  }

  function isOffline(): boolean {
    if (!navigator.onLine) return true
    return false
  }

  return {
    status,
    setStatus,
    isOffline,
  }
})
