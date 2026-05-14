<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { recipesManager } from '@/services/recipes_manager'
import { tagsManager } from '@/services/tags_manager'
import { t } from '@/lang/i18n'
import CardsGrid from '@/views/components/CardsGrid.vue'
import NavBreadcrumbs from './components/NavBreadcrumbs.vue'
import type { RecipeLocal } from '@/types'

const route = useRoute()
const router = useRouter()
const viewType = route.name as string
const emptyMessage = ref('')
const loading = ref(false)
const error = ref<string | null>(null)
const recipes = ref<RecipeLocal[]>([])

onMounted(async () => {
  loading.value = true
  try {
    switch (viewType) {
      case 'tag':
        recipes.value = await recipesManager.getTagged(route.params.id as string)
        if (!recipes.value.length) {
          await tagsManager.removeOrphanedFromLocal([route.params.id as string])
          router.push({ name: 'tags' }) // DO NOT include when implementing default view setting
        }
        break
      case 'last':
        recipes.value = await recipesManager.getLastViewed()
        if (!recipes.value.length) emptyMessage.value = t('recipes_view.no_recently_viewed_recipes')
        break
      case 'favorites':
        recipes.value = await recipesManager.getFavorites()
        if (!recipes.value.length) emptyMessage.value = t('recipes_view.no_favorite_recipes')
        break
      default:
        throw new Error(t('error.invalid_recipes_view_type'))
    }
  } catch (err) {
    error.value = (err as Error).message
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div v-if="!error && !loading && recipes.length" class="isolate-stacking-context">
    <Transition :name="viewType === 'tag' ? 'slide-in-rtl' : ''" appear>
      <NavBreadcrumbs :viewType />
    </Transition>
    <Transition :name="viewType === 'tag' ? 'slide-in-rtl' : ''" appear>
      <CardsGrid :recipes="recipes" />
    </Transition>
  </div>
  <p v-else-if="error" class="error">{{ t('error') }}: {{ error }}</p>
  <p v-else-if="!error && !loading" class="empty_recipes_view">{{ emptyMessage }}</p>
</template>

<style scoped></style>
