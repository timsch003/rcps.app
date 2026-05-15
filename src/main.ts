import App from './App.vue'
import './assets/css/main.css'
import router from './routes'
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { useAuthStore } from './stores/auth'
import { useSettingsStore } from './stores/settings'
import { useSyncStore } from './stores/sync_status'
import { sync } from './services/sync'
import { tagsManager } from './services/tags_manager'
import { unitsManager } from './services/units_manager'
import { seedLocalDB } from './utils/local_db_seeding'
import { resetTestData } from './adapters/pocketbase'
import { i18n } from './lang/i18n'
import { registerServiceWorker } from './utils/register_service_worker'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
const authStore = useAuthStore()
useSettingsStore()
useSyncStore()

if (import.meta.env.DEV && !localStorage.getItem('seeded')) {
  await resetTestData()
  await seedLocalDB()
}

await tagsManager.cacheAll()
await unitsManager.cacheAll()

app.use(router)
app.use(i18n)

app.mount('#app')
registerServiceWorker()

if (authStore.isAuth) void sync.trigger(true)
