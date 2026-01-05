import './assets/main.css'

import App from './App.vue'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { createI18n } from 'vue-i18n'
import router from './routes'

const i18n = createI18n({
  legacy: false,
  locale: 'en',
  fallbackLocale: 'en',
  messages: {
    en: {
      Home: 'Home',
      Settings: 'Settings',
      Favorites: 'Favorites',
    },
    de: {
      Home: 'Home',
      Settings: 'Einstellungen',
      Favorites: 'Favoriten',
    },
  },
})

const app = createApp(App)

const pinia = createPinia()
app.use(pinia)
app.use(router)
app.use(i18n)

app.mount('#app')

// PocketBase's LocalAuthStore handles auth initialization automatically
