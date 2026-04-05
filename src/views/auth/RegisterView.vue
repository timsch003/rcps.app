<script setup lang="ts">
import { ref } from 'vue'
import { registerUser } from '@/adapters/pocketbase'
import { t } from '@/lang/i18n'
import IconSpinner from '@/views/icons/IconSpinner.vue'

const email = ref('')
const password = ref('')
const passwordConfirm = ref('')
const isEmailValidationSent = ref(false)
const isValidating = ref(false)
const errorMessage = ref('')
const rawLocale = window.navigator.language || 'en-US'
const locale = rawLocale.split('-')[0]?.toLowerCase() || 'en'

async function onSubmit() {
  errorMessage.value = ''
  isValidating.value = true

  const result = await registerUser(email.value, password.value, passwordConfirm.value, locale)

  if (result.success) {
    isEmailValidationSent.value = true
  } else {
    errorMessage.value = result.error || t('auth.registration_failed')
  }
  isValidating.value = false
}
</script>

<template>
  <h1>{{ t('auth.register') }}</h1>
  <form v-if="!isEmailValidationSent" @submit.prevent="onSubmit" autocomplete="on">
    <label for="email" aria-required="true">{{ t('auth.email') }}</label>
    <input v-model="email" type="email" id="email" required="true" />
    <label for="password" aria-required="true">{{ t('auth.password') }}</label>
    <input v-model="password" type="password" id="password" required="true" />
    <label for="password_confirm" aria-required="true">{{ t('auth.confirm_password') }}</label>
    <input v-model="passwordConfirm" type="password" id="password_confirm" required="true" />
    <div class="submit">
      <button type="submit" :disabled="isValidating">{{ t('auth.register') }}</button>
      <IconSpinner v-if="isValidating" />
    </div>
    <p class="error" v-if="!isEmailValidationSent && errorMessage != ''">
      {{ errorMessage }}
    </p>
  </form>
  <p class="success" v-else>{{ t('auth.email_verification_sent') }}</p>
</template>
