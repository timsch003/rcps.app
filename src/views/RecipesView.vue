<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { recipesManager } from '@/services/recipes_manager'
import { t } from '@/lang/i18n'
import CardsGrid from '@/views/components/CardsGrid.vue'
import NavBreadcrumbs from './components/NavBreadcrumbs.vue'
import type { RecipeLocal } from '@/types'

const route = useRoute()
const loading = ref(false)
const error = ref<string | null>(null)
const recipes = ref<RecipeLocal[]>([])

onMounted(async () => {
  loading.value = true
  try {
    recipes.value = await recipesManager.getTagged(route.params.id as string)
    if (!recipes.value.length) throw new Error(t('error.no_recipes_found_for_tag'))
  } catch (err) {
    error.value = (err as Error).message
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <NavBreadcrumbs />
  <CardsGrid v-if="!error && !loading" :recipes="recipes" />
  <p v-else-if="error" class="error">{{ t('error') }}: {{ error }}</p>
</template>

<style scoped></style>
