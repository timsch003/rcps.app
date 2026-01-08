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
          path: '/verify-email',
          name: 'verify-email',
          component: VerifyEmailView,
        },
        {
          path: '/reset-password',
          name: 'reset-password',
          component: ResetPasswordView,
        },
        {
          path: '/change-email',
          name: 'change-email',
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
