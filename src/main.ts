import App from './App.vue'
import './assets/css/main.css'
import router from './routes'
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import { useIngredientsStore } from './stores/ingredients'
import { useRecipeIngredientsStore } from './stores/recipe_ingredients'
import { useRecipesStore } from './stores/recipes'
import { useTagsStore } from './stores/tags'
import { useUnitsStore } from './stores/units'
import { seedLocalDB } from './utils/local_db_seeding'
import { i18n } from './lang/i18n'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
pinia.use(piniaPluginPersistedstate)

const ingredientsStore = useIngredientsStore()
const recipeIngredientsStore = useRecipeIngredientsStore()
const recipesStore = useRecipesStore()
const tagsStore = useTagsStore()
const unitsStore = useUnitsStore()

if (import.meta.env.DEV) await seedLocalDB()
await ingredientsStore.init()
await recipeIngredientsStore.init()
await recipesStore.init()
await tagsStore.init()
await unitsStore.init()

app.use(router)
app.use(i18n)

app.mount('#app')
