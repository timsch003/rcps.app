import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { pb } from '@/services/pocketbase'
import { getOrCreateDeviceId } from '@/utils/uuid'
import { ClientResponseError } from 'pocketbase'
import type { AuthRecord } from 'pocketbase'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<{ id: string; email: string } | null>(null)
  const isAuth = computed(() => pb.authStore.isValid && !!user.value)
  const deviceId = getOrCreateDeviceId()

  // Listen to PocketBase auth changes
  pb.authStore.onChange((token, model: AuthRecord) => {
    if (model) {
      const userId = model.userId || model.id
      user.value = { id: userId, email: model.email }
    } else {
      user.value = null
    }
  }, true) // fireImmediately = true to sync initial state

  async function register(email: string, password: string, passwordConfirm: string) {
    const newUserId = getOrCreateDeviceId()

    try {
      await pb.collection('users').create({
        id: newUserId,
        email: email,
        password: password,
        passwordConfirm: passwordConfirm,
      })
      return { success: true }
    } catch (e: unknown) {
      return { success: false, error: (e as Error).message }
    }
  }

  async function login(email: string, password: string) {
    try {
      await pb.collection('users').authWithPassword(email, password)
      // PocketBase automatically saves to authStore
      return { success: true }
    } catch (e: unknown) {
      if (e instanceof ClientResponseError) {
        return { success: false, error: `${e.status}: ${e.message}` }
      }
      return { success: false, error: (e as Error).message }
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
