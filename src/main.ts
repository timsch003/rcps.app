import App from './App.vue'
import './assets/css/main.css'
import router from './routes'
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import { i18n } from './lang/i18n'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)
app.use(i18n)

pinia.use(piniaPluginPersistedstate)

app.mount('#app')
