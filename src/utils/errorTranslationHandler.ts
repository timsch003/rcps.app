import { ClientResponseError } from 'pocketbase'
import { t } from '@/lang/i18n'

export default function errorTranslationHandler(e: unknown): string {
  if (e instanceof ClientResponseError && e.response && e.response.data) {
    const keyName = Object.keys(e.response.data)[0]!
    const d = e.response.data

    switch (keyName) {
      case 'email':
        if (d.email.code === 'validation_not_unique') {
          return t('auth.email_in_use')
        }
        break
      case 'password':
        if (d.password.code === 'validation_min_text_constraint') {
          return t('auth.password_too_short')
        }
        break
      case 'passwordConfirm':
        if (d.passwordConfirm.code === 'validation_values_mismatch') {
          return t('auth.passwords_do_not_match')
        }
        break
      case 'token':
        if (d.token.code === 'validation_required') {
          return t('auth.invalid_token')
        }
        break
    }
  }

  return t('unknown_error')
}
