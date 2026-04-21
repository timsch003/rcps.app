import { defineStore } from 'pinia'
import { computed, nextTick, ref } from 'vue'
import { pb } from '@/adapters/pocketbase'
import { sync } from '@/services/sync'
import type { AuthRecord } from 'pocketbase'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<AuthRecord | null>(null)
  const isAuth = computed(() => pb.authStore.isValid && !!user.value?.verified)

  pb.authStore.onChange((_token, record: AuthRecord) => {
    const wasAuth = isAuth.value

    user.value = record

    if (!wasAuth && isAuth.value) nextTick(() => sync.init())
  }, true)

  return {
    user,
    isAuth,
  }
})
