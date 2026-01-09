import { defineStore } from 'pinia'
import { ref } from 'vue'
import { pb } from '@/services/pocketbase'
import type { AuthRecord } from 'pocketbase'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<{ id: string; email: string } | null>(null)
  const isAuth = ref(<boolean>false)

  pb.authStore.onChange((token, model: AuthRecord) => {
    if (model) {
      user.value = { id: model.id, email: model.email }
    } else {
      user.value = null
    }
    isAuth.value = pb.authStore.isValid && !!user.value
  }, true)

  return {
    user,
    isAuth,
  }
})
