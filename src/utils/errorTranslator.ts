import { ClientResponseError } from 'pocketbase'
import type { ComposerTranslation } from 'vue-i18n'

export default function errorFormatter(e: unknown, t: ComposerTranslation) {
  if (e instanceof ClientResponseError && e.response && e.response.data) {
    const keyName = Object.keys(e.response.data)[0]!
    const d = e.response.data

    switch (keyName) {
      case 'email':
        if (d.email.code === 'validation_not_unique') {
          return t('This email is already being used.')
        }
      case 'password':
        if (d.password.code === 'validation_min_text_constraint') {
          return t('The password has to be at least 8 characters long.')
        }
      case 'passwordConfirm':
        if (d.passwordConfirm.code === 'validation_values_mismatch') {
          return t('The passwords do not match.')
        }
    }
  }

  return t('An error occurred during registration.')
}
