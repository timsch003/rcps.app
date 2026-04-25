import App from './App.vue'
import './assets/css/main.css'
import router from './routes'
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { useSettingsStore } from './stores/settings'
import { tagsManager } from './services/tags_manager'
import { unitsManager } from './services/units_manager'
import { seedLocalDB } from './utils/local_db_seeding'
import { resetTestData } from './adapters/pocketbase'
import { i18n } from './lang/i18n'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
useSettingsStore()

if (import.meta.env.DEV && !localStorage.getItem('seeded')) {
  await resetTestData()
  await seedLocalDB()
}

await tagsManager.cacheAll()
await unitsManager.cacheAll()

app.use(router)
app.use(i18n)

app.mount('#app')
