import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { pb, registerUser, loginUser, logoutUser  } from '@/services/pocketbase'
import { getOrCreateDeviceId } from '@/utils/uuid'
import errorTranslator from '@/utils/errorTranslator'
import type { AuthRecord } from 'pocketbase'
import type { ComposerTranslation } from 'vue-i18n'

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

  async function register(email: string, password: string, passwordConfirm: string, t: ComposerTranslation) {
    const newUserId = getOrCreateDeviceId()

    try {
      await registerUser(newUserId, email, password, passwordConfirm)
      return { success: true }
    } catch (e: unknown) {
      return { success: false, error: errorTranslator(e, t) }
    }
  }

  async function login(email: string, password: string, t: ComposerTranslation) {
    try {
      await loginUser(email, password)
      // PocketBase automatically saves to authStore
      return { success: true }
    } catch (e: unknown) {
      return { success: false, error: errorTranslator(e, t) }
    }
  }

  async function logout() {
    await logoutUser()
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
