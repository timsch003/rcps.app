import { useAuthStore } from '@/stores/auth'
import { createRouter, createWebHistory } from 'vue-router'
import AppLayout from '@/views/layouts/AppLayout.vue'
import AuthLayout from '@/views/layouts/AuthLayout.vue'
import TagsView from './views/TagsView.vue'
import RecipesView from './views/RecipesView.vue'
import RecipeView from './views/RecipeView.vue'
import LoginView from './views/auth/LoginView.vue'
import RegisterView from './views/auth/RegisterView.vue'
import VerifyEmailView from './views/auth/VerifyEmailView.vue'
import ResetPasswordView from './views/auth/ResetPasswordView.vue'
import ChangeEmailView from './views/auth/ChangeEmailView.vue'
import FavoritesView from './views/FavoritesView.vue'
import CreateView from './views/CreateView.vue'

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
          name: 'tags',
          component: TagsView,
        },
        {
          path: '/favorites',
          name: 'favorites',
          component: FavoritesView,
        },
        {
          path: '/favorite/:id',
          name: 'favorite',
          component: RecipeView,
        },
        {
          path: '/tag/:id',
          name: 'tag',
          component: RecipesView,
        },
        {
          path: '/tag/:tag/recipe/:id',
          name: 'recipe',
          component: RecipeView,
        },
        { path: '/create', name: 'create', component: CreateView },
      ],
    },
    {
      path: '/',
      component: AuthLayout,
      beforeEnter: () => {
        if (useAuthStore().isAuth) {
          return { name: 'tags' }
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
          redirect: { name: 'tags' },
        },
      ],
    },
  ],
})

export default router
