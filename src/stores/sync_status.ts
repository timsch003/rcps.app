import { defineStore } from 'pinia'
import { ref } from 'vue'
import { sync } from '@/services/sync'
import type { SyncStatus } from '@/types'

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
