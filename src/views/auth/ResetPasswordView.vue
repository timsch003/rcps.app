<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { pb } from '@/services/pocketbase'

const route = useRoute()
const router = useRouter()
const status = ref<'verifying' | 'success' | 'error'>('verifying')
const errorMessage = ref('')

onMounted(async () => {
  const token = route.query.token as string
  const password = ref('')
  const passwordConfirm = ref('')

  if (!token) {
    status.value = 'error'
    errorMessage.value = 'Missing verification token'
    return
  }

  try {
    await pb.collection('users').confirmPasswordReset(token, password.value, passwordConfirm.value)
    status.value = 'success'

    setTimeout(() => {
      router.push('/login')
    }, 2000)
  } catch (err: any) {
    status.value = 'error'
    errorMessage.value = err?.message || 'Password reset failed'
  }
})
</script>

<template>
  <div>Reset password view: TODO</div>
</template>
