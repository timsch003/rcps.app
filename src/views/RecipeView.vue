<script setup lang="ts">
import type { Recipe, IdAndName } from '../types'

const { recipe } = defineProps<{
  recipe: Recipe
  tags: IdAndName[]
}>()
</script>

<template>
  <div>{{ recipe.name }}</div>
</template>

<style scoped></style>
