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
  })

  onUnmounted(() => {
    window.removeEventListener('online', handleOnline)
    window.removeEventListener('offline', handleOffline)
  })

  return { isOnline, wasOffline }
}
