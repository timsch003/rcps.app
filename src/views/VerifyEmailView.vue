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

  if (!token) {
    status.value = 'error'
    errorMessage.value = 'Missing verification token'
    return
  }

  try {
    await pb.collection('users').confirmVerification(token)
    status.value = 'success'

    setTimeout(() => {
      router.push('/login')
    }, 2000)
  } catch (err: any) {
    status.value = 'error'
    errorMessage.value = err?.message || 'Verification failed'
  }
})
</script>

<template>
  <div>
    <div v-if="status === 'verifying'">
      <h1>Verifying your email...</h1>
    </div>

    <div v-else-if="status === 'success'">
      <h1>Email verified!</h1>
      <p>Redirecting to login...</p>
    </div>

    <div v-else-if="status === 'error'">
      <h1>Verification failed</h1>
      <p>{{ errorMessage }}</p>
    </div>
  </div>
</template>
