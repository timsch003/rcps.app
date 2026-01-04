import { ref, onMounted, onUnmounted } from 'vue'
import { useSyncStore } from '@/stores/sync'

export function useOnlineStatus() {
  const isOnline = ref(navigator.onLine)
  const wasOffline = ref(false)
  const syncStore = useSyncStore()

  function handleOnline() {
    isOnline.value = true
    syncStore.isOnline = true

    if (wasOffline.value) {
      wasOffline.value = false
      // Trigger reconciliation
      window.dispatchEvent(new CustomEvent('came-back-online'))
    }
  }

  function handleOffline() {
    isOnline.value = false
    wasOffline.value = true
    syncStore.isOnline = false
  }

  onMounted(() => {
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    if (syncStore.autoSyncEnabled) {
      syncStore.startAutoSync()
    }
  })

  onUnmounted(() => {
    window.removeEventListener('online', handleOnline)
    window.removeEventListener('offline', handleOffline)
    syncStore.stopAutoSync()
  })

  return { isOnline, wasOffline }
}
