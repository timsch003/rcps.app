<script setup lang="ts">
import { ref } from 'vue'
import { loginUser } from '@/services/pocketbase'
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'
import { t } from '@/lang/i18n'
import IconSpinner from '@/views/icons/IconSpinner.vue'

const authStore = useAuthStore()
const router = useRouter()
const email = ref('')
const password = ref('')
const isValidating = ref(false)
const errorMessage = ref('')

async function onSubmit() {
  errorMessage.value = ''
  isValidating.value = true

  const result = await loginUser(email.value, password.value)

  if (result.success && authStore.isAuth) {
    router.push({ name: 'tags' })
  } else {
    errorMessage.value = t('auth.login_failed')
    isValidating.value = false
  }
}
</script>

<template>
  <h1>{{ t('auth.login') }}</h1>
  <form @submit.prevent="onSubmit" autocomplete="on">
    <label for="email" aria-required="true">{{ t('auth.email') }}</label>
    <input v-model="email" type="email" id="email" required="true" />
    <label for="password" aria-required="true">{{ t('auth.password') }}</label>
    <input v-model="password" type="password" id="password" required="true" />
    <div class="submit">
      <button type="submit" :disabled="isValidating">{{ t('auth.login') }}</button>
      <IconSpinner v-if="isValidating" />
    </div>
    <p class="error" v-if="errorMessage != ''">
      {{ errorMessage }}
    </p>
  </form>
</template>
