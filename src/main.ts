import App from './App.vue'
import './assets/css/main.css'
import router from './routes'
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import { useRecipesStore } from './stores/recipes'
import { useTagsStore } from './stores/tags'
import { i18n } from './lang/i18n'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
pinia.use(piniaPluginPersistedstate)
await useRecipesStore().init()
await useTagsStore().init()

app.use(router)
app.use(i18n)

app.mount('#app')
