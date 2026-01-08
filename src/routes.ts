import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import AppLayout from '@/views/layouts/AppLayout.vue'
import AuthLayout from '@/views/layouts/AuthLayout.vue'
import HomeView from './views/HomeView.vue'
import RecipesView from './views/RecipesView.vue'
import RecipeView from './views/RecipeView.vue'
import LoginView from './views/LoginView.vue'
import RegisterView from './views/RegisterView.vue'
import VerifyEmailView from './views/VerifyEmailView.vue'
import ResetPasswordView from './views/ResetPasswordView.vue'
import ChangeEmailView from './views/ChangeEmailView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
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
    {
      path: '/a',
      component: AuthLayout,
      children: [
        {
          path: 'login',
          name: 'login',
          component: LoginView,
        },
        {
          path: 'register',
          component: RegisterView,
        },
        {
          path: 'verify-email',
          component: VerifyEmailView,
        },
        {
          path: 'reset-password',
          component: ResetPasswordView,
        },
        {
          path: 'change-email',
          component: ChangeEmailView,
        },
      ],
    },
  ],
})

router.beforeEach(async (to) => {
  if ((await !useAuthStore().isAuth) && !to.path.startsWith('/a')) {
    return { name: 'login' }
  }
})

export default router
