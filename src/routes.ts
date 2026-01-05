import { createRouter, createWebHistory } from 'vue-router'
import { isAuthenticated } from './services/auth'
import AppLayout from './layouts/AppLayout.vue'
import LoggedOutLayout from './layouts/LoggedOutLayout.vue'
import HomeView from './views/HomeView.vue'
import RecipesView from './views/RecipesView.vue'
import RecipeView from './views/RecipeView.vue'
import LoginView from './views/LoginView.vue'
import RegisterView from './views/RegisterView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/a',
      component: LoggedOutLayout,
      children: [
        {
          path: 'login',
          name: 'login',
          component: LoginView,
        },
        {
          path: 'register',
          name: 'register',
          component: RegisterView,
        },
      ],
    },
    {
      path: '/',
      component: AppLayout,
      children: [
        {
          path: 'tags',
          name: 'home',
          component: HomeView,
        },
        {
          path: 'tag/:id?',
          name: 'tag',
          component: RecipesView,
        },
        {
          path: 'recipe/:id?',
          name: 'recipe',
          component: RecipeView,
        },
      ],
    },
  ],
})

router.beforeEach(async (to) => {
  if ((await !isAuthenticated()) && to.name !== 'login' && to.name !== 'register') {
    return { name: 'login' }
  }
})

export default router
