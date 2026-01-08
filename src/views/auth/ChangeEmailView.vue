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

  if (!token) {
    status.value = 'error'
    errorMessage.value = 'Missing verification token'
    return
  }

  try {
    await pb.collection('users').confirmEmailChange(token, password.value)
    status.value = 'success'

    setTimeout(() => {
      router.push('/login')
    }, 2000)
  } catch (err: any) {
    status.value = 'error'
    errorMessage.value = err?.message || 'Email change failed'
  }
})
</script>

<template>
  <div>Change email view: TODO</div>
</template>
