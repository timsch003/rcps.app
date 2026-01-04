import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import {
  loginUser,
  logoutUser,
  registerUser,
  getCurrentUser,
  isAuthenticated,
} from '@/services/pocketbase'
import { generateUuid, getOrCreateDeviceId } from '@/utils/uuid'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<{ id: string; email: string } | null>(null)
  const isAuth = computed(() => !!user.value)
  const deviceId = getOrCreateDeviceId()

  async function register(email: string, password: string) {
    const userId = generateUuid()
    const result = await registerUser(email, password, userId)

    if (result.success) {
      localStorage.setItem('user_id', userId)
      return { success: true }
    }

    return { success: false, errors: result.errors }
  }

  async function login(email: string, password: string) {
    const result = await loginUser(email, password)

    if (result.success && result.user) {
      const userId = result.user.userId || result.user.id
      localStorage.setItem('user_id', userId)
      user.value = { id: userId, email: result.user.email }
      return { success: true }
    }

    return { success: false, error: result.error }
  }

  async function logout() {
    await logoutUser()
    user.value = null
  }

  function initializeAuth() {
    if (isAuthenticated()) {
      const currentUser = getCurrentUser()
      if (currentUser) {
        const userId = currentUser.userId || currentUser.id
        user.value = { id: userId, email: currentUser.email }
        localStorage.setItem('user_id', userId)
      }
    } else {
      const userId = localStorage.getItem('user_id')
      if (userId) {
        // User ID exists but not authenticated - may need to log in again
        user.value = null
      }
    }
  }

  return {
    user,
    isAuth,
    deviceId,
    register,
    login,
    logout,
    initializeAuth,
  }
})
