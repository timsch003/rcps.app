import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { pb } from '@/services/pocketbase'
import type { AuthRecord } from 'pocketbase'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<{ id: string; email: string } | null>(null)
  const isAuth = computed(() => pb.authStore.isValid && !!user.value)

  pb.authStore.onChange((token, model: AuthRecord) => {
    if (model) {
      user.value = { id: model.id, email: model.email }
    } else {
      user.value = null
    }
  }, true)

  return {
    user,
    isAuth,
  }
})
