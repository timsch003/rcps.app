<script setup lang="ts">
import CardsGrid from '@/views/components/CardsGrid.vue'
import type { RecipeLocal } from '@/types'

defineProps<{
  recipes: RecipeLocal[]
}>()
</script>

<template>
  <CardsGrid :data="recipes" />
</template>

<style scoped></style>
