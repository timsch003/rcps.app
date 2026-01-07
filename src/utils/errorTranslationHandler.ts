import { ClientResponseError } from 'pocketbase'
import { t } from '@/lang/i18n'

export default function errorTranslationHandler(e: unknown) {
  if (e instanceof ClientResponseError && e.response && e.response.data) {
    const keyName = Object.keys(e.response.data)[0]!
    const d = e.response.data

    switch (keyName) {
      case 'email':
        if (d.email.code === 'validation_not_unique') {
          return t('registration.email_in_use')
        }
      case 'password':
        if (d.password.code === 'validation_min_text_constraint') {
          return t('registration.password_too_short')
        }
      case 'passwordConfirm':
        if (d.passwordConfirm.code === 'validation_values_mismatch') {
          return t('registration.passwords_do_not_match')
        }
    }
  }

  return t('registration.error')
}
