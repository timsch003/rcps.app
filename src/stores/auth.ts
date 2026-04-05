import { defineStore } from 'pinia'
import { ref } from 'vue'
import { pb } from '@/adapters/pocketbase'
import type { AuthRecord } from 'pocketbase'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<{ id: string; email: string; verified: boolean } | null>(null)
  const isAuth = ref(<boolean>false)

  pb.authStore.onChange((token, model: AuthRecord) => {
    if (model) {
      user.value = { id: model.id, email: model.email, verified: model.verified }
    } else {
      user.value = null
    }
    isAuth.value = pb.authStore.isValid && !!user.value && user.value.verified
  }, true)

  return {
    user,
    isAuth,
  }
})
