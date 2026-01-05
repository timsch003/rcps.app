<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/stores/auth'

const { t } = useI18n()
const auth = useAuthStore()

const email = ref('')
const password = ref('')
const passwordConfirm = ref('')
const isEmailValidationSent = ref(false)

async function onSubmit() {
  const res = await auth.register(email.value, password.value, passwordConfirm.value)
  if (res.success) {
    isEmailValidationSent.value = true
  } else {
    console.error(res.error)
  }
}
</script>

<template>
  <div>
    <h1>{{ t('Register') }}</h1>
    <form v-if="!isEmailValidationSent" @submit.prevent="onSubmit" autocomplete="on">
      <label for="email">{{ t('Email') }}</label>
      <input v-model="email" type="email" id="email" />
      <label for="password">{{ t('Password') }}</label>
      <input v-model="password" type="password" id="password" />
      <label for="password_confirm">{{ t('Confirm password') }}</label>
      <input v-model="passwordConfirm" type="password" id="password_confirm" />
      <button type="submit">{{ t('Register') }}</button>
    </form>
    <p v-else>{{ t('Email validation sent. Please check your inbox.') }}</p>
  </div>
</template>

<style scoped></style>
