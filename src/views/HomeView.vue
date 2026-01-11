<script setup lang="ts">
import CardsGrid from '@/views/components/CardsGrid.vue'
import { addRecipe } from '@/services/dexie'
import { generateUuid } from '@/utils/uuid'
import type { UUID } from '@/types'

defineProps<{ tagIds: UUID[] }>()

addRecipe({
  id: generateUuid(),
  name: 'Test Recipe',
  tagIds: ['tag-1', 'tag-2'],
  recipeIngredientIds: ['ingredient-1', 'ingredient-2'],
  instructions: 'Mix ingredients and cook.',
  notes: 'This is a test recipe.',
  updated: null,
  synced: false,
  pendingSync: false,
})
</script>

<template>
  <CardsGrid :tagIds="tagIds" />
</template>
