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
import CreateEditView from './views/CreateEditView.vue'
import CreateFromImagesView from './views/CreateFromImagesView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  linkActiveClass: 'active',
  routes: [
    {
      path: '/app',
      component: AppLayout,
      beforeEnter: () => {
        if (!useAuthStore().isAuth) return { name: 'login' }
      },
      children: [
        {
          path: '/',
          name: 'tags',
          component: TagsView,
          beforeEnter: (to, from) => {
            if (from.name === 'tag') to.meta.transition = 'slide-in-ltr'
          },
        },
        {
          path: '/tag/:id',
          name: 'tag',
          component: RecipesView,
        },
        {
          path: '/last',
          name: 'last',
          component: RecipesView,
        },
        {
          path: '/favorites',
          name: 'favorites',
          component: RecipesView,
        },
        {
          path: '/recipe/:id',
          name: 'recipe',
          component: RecipeView,
          beforeEnter: (to, from) => {
            // meta.fromPath is used to handle creating, viewing
            // and editing a recipe as one single router history entry.
            if (from.name !== 'edit' && from.name !== 'create') to.meta.fromPath = from.fullPath
            else to.meta.fromPath = from.meta.fromPath
          },
        },
        {
          path: '/edit/:id',
          name: 'edit',
          component: CreateEditView,
          beforeEnter: (to, from) => {
            to.meta.fromPath = from.meta.fromPath
          },
        },
        {
          path: '/create',
          name: 'create',
          component: CreateEditView,
          beforeEnter: (to, from) => {
            if (from.name === 'create-from-images') to.meta.fromPath = from.meta.fromPath
            else to.meta.fromPath = from.fullPath
          },
        },
        {
          path: '/create-from-images',
          name: 'create-from-images',
          component: CreateFromImagesView,
          beforeEnter: (to, from) => {
            to.meta.fromPath = from.fullPath
          },
        },
      ],
    },
    {
      path: '/auth',
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
