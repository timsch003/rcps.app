<script setup lang="ts">
import type { RecipeLocal, UUID } from '@/types'

const { recipe } = defineProps<{
  recipe: RecipeLocal
  tagsIds: UUID[]
}>()
</script>

<template>
  <div>{{ recipe.name }}</div>
</template>

<style scoped></style>
