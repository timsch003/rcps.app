import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { pb } from '@/services/pocketbase'
import { getOrCreateDeviceId } from '@/utils/uuid'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<{ id: string; email: string } | null>(null)
  const isAuth = computed(() => pb.authStore.isValid && !!user.value)
  const deviceId = getOrCreateDeviceId()

  // Listen to PocketBase auth changes
  pb.authStore.onChange((token, model) => {
    if (model) {
      const userId = (model as any).userId || model.id
      user.value = { id: userId, email: (model as any).email }
    } else {
      user.value = null
    }
  }, true) // fireImmediately = true to sync initial state

  async function register(email: string, password: string) {
    const userId = getOrCreateDeviceId()

    try {
      await pb.collection('users').create({
        email,
        password,
        passwordConfirm: password,
        userId,
      })
      return { success: true }
    } catch (e: any) {
      return { success: false, error: e.message }
    }
  }

  async function login(email: string, password: string) {
    try {
      await pb.collection('users').authWithPassword(email, password)
      // PocketBase automatically saves to authStore
      return { success: true }
    } catch (e: any) {
      return { success: false, error: e.message }
    }
  }

  async function logout() {
    pb.authStore.clear()
    // PocketBase automatically triggers onChange
  }

  return {
    user,
    isAuth,
    deviceId,
    register,
    login,
    logout,
  }
})
