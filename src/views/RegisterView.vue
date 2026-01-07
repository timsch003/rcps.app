<script setup lang="ts">
import { ref } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { t } from '@/lang/i18n'

const auth = useAuthStore()
const email = ref('')
const password = ref('')
const passwordConfirm = ref('')
const responseError = ref('')
const isEmailValidationSent = ref(false)

const rawLocale = window.navigator.language || 'en-US'
const locale = rawLocale.split('-')[0]?.toLowerCase() || 'en'

async function onSubmit() {
  const register = await auth.register(email.value, password.value, passwordConfirm.value, locale)

  if (register.success) {
    isEmailValidationSent.value = true
  } else {
    responseError.value = register.error || ''
  }
}
</script>

<template>
  <div>
    <h1>{{ t('Register') }}</h1>
    <form v-if="!isEmailValidationSent" @submit.prevent="onSubmit" autocomplete="on">
      <label for="email" aria-required="true">{{ t('Email') }}</label>
      <input v-model="email" type="email" id="email" required="true" />
      <label for="password" aria-required="true">{{ t('Password') }}</label>
      <input v-model="password" type="password" id="password" required="true" />
      <label for="password_confirm" aria-required="true">{{ t('Confirm password') }}</label>
      <input v-model="passwordConfirm" type="password" id="password_confirm" required="true" />
      <button type="submit">{{ t('Register') }}</button>
      <p class="error" v-if="!isEmailValidationSent && responseError != ''">
        {{ responseError }}
      </p>
    </form>
    <p class="success" v-else>{{ t('registration.email_verification_sent') }}</p>
  </div>
</template>
