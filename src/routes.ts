import { useAuthStore } from '@/stores/auth'
import { createRouter, createWebHistory } from 'vue-router'
import AppLayout from '@/views/layouts/AppLayout.vue'
import AuthLayout from '@/views/layouts/AuthLayout.vue'
import HomeView from './views/HomeView.vue'
import RecipesView from './views/RecipesView.vue'
import RecipeView from './views/RecipeView.vue'
import LoginView from './views/auth/LoginView.vue'
import RegisterView from './views/auth/RegisterView.vue'
import VerifyEmailView from './views/auth/VerifyEmailView.vue'
import ResetPasswordView from './views/auth/ResetPasswordView.vue'
import ChangeEmailView from './views/auth/ChangeEmailView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  linkActiveClass: 'active',
  routes: [
    {
      path: '/',
      component: AppLayout,
      beforeEnter: () => {
        if (!useAuthStore().isAuth) {
          return { name: 'login' }
        }
      },
      children: [
        {
          path: '/',
          name: 'home',
          component: HomeView,
        },
        {
          path: '/tag/:id?',
          name: 'tag',
          component: RecipesView,
        },
        {
          path: '/recipe/:id?',
          name: 'recipe',
          component: RecipeView,
        },
      ],
    },
    {
      path: '/',
      component: AuthLayout,
      beforeEnter: () => {
        if (useAuthStore().isAuth) {
          return { name: 'home' }
        }
      },
      children: [
        {
          path: '/login',
          name: 'login',
          component: LoginView,
        },
        {
          path: '/register',
          name: 'register',
          component: RegisterView,
        },
        {
          path: '/verify',
          name: 'verify',
          component: VerifyEmailView,
        },
        {
          path: '/reset',
          name: 'reset',
          component: ResetPasswordView,
        },
        {
          path: '/change',
          name: 'change',
          component: ChangeEmailView,
        },
        {
          path: '/:pathMatch(.*)*', // 404 catch-all route
          redirect: { name: 'home' },
        },
      ],
    },
  ],
})

export default router
