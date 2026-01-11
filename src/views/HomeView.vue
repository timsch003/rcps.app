<script setup lang="ts">
import CardsGrid from '@/views/components/CardsGrid.vue'
import { addRecipe } from '@/services/dexie'
import { generateUuid } from '@/utils/uuid'
import { useAuthStore } from '@/stores/auth'
import type { IdAndName } from '@/types'

defineProps<{ tags: IdAndName[] }>()

const authStore = useAuthStore()
const userId = authStore.user?.id || ''

addRecipe({
  id: generateUuid(),
  userId: userId,
  name: 'Test Recipe',
  tagIds: ['tag-1', 'tag-2'],
  ingredients: [
    { id: 'ingredient-1', recipeId: 'test-id' },
    { id: 'ingredient-2', recipeId: 'test-id' },
  ],
  instructions: 'Mix ingredients and cook.',
  notes: 'This is a test recipe.',
  updated: Date.now(),
  deviceId: 'test-device',
  synced: false,
  pendingSync: false,
  localOnly: true,
})
</script>

<template>
  <CardsGrid :tags="tags" />
</template>
