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
    sync.init()
  })

  function setStatus(newStatus: SyncStatus) {
    status.value = newStatus
  }

  function isOffline(): boolean {
    if (status.value === 'offline' || !navigator.onLine) return true
    return false
  }

  return {
    status,
    setStatus,
    isOffline,
  }
})
