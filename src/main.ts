import App from './App.vue'
import './assets/css/main.css'
import router from './routes'
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import { tagsManager } from './services/tags_manager'
import { unitsManager } from './services/units_manager'
import { seedLocalDB } from './utils/local_db_seeding'
import { i18n } from './lang/i18n'
import { sync } from './services/sync'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
pinia.use(piniaPluginPersistedstate)

if (import.meta.env.DEV && !localStorage.getItem('seeded')) await seedLocalDB()

await tagsManager.cacheAll()
await unitsManager.cacheAll()

app.use(router)
app.use(i18n)

app.mount('#app')
