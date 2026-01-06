import { createI18n } from 'vue-i18n'
import locales from './locales.json'

export const i18n = createI18n({
  legacy: false,
  locale: 'de',
  fallbackLocale: 'en',
  messages: locales,
})

export const t = i18n.global.t
