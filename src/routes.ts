import { createRouter, createWebHistory } from 'vue-router'
import HomeView from './views/HomeView.vue'
import RecipesView from './views/RecipesView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },
    {
      path: '/tag/:id',
      name: 'tag',
      component: HomeView,
      props: true,
    },
    {
      path: '/recipes/:id',
      name: 'recipes',
      component: RecipesView,
      props: true,
    },
  ],
})

export default router
