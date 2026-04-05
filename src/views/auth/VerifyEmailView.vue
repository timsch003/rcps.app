<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import { verifyEmail } from '@/adapters/pocketbase'
import { t } from '@/lang/i18n'

const status = ref<'verifying' | 'success' | 'error'>('verifying')
const errorMessage = ref('')

onMounted(async () => {
  const token = useRoute().query.token as string

  const result = await verifyEmail(token)

  if (result.success) {
    status.value = 'success'
  } else {
    status.value = 'error'
    errorMessage.value = result.error as string
  }
})
</script>

<template>
  <div v-if="status === 'verifying'" class="verifying">
    <h2>
      {{ t('auth.verifying_email') }}
    </h2>
  </div>

  <div v-else-if="status === 'success'">
    <h2>
      {{ t('auth.email_verified') }}
      <p>
        <br />
        <RouterLink :to="{ name: 'login' }">{{ t('auth.login') }}</RouterLink>
      </p>
    </h2>
  </div>

  <div v-else-if="status === 'error'">
    <h2>{{ t('auth.verification_failed') }}</h2>
    <p class="error">{{ errorMessage }}</p>
  </div>
</template>

<style scoped>
a {
  text-decoration: underline;
}
</style>
