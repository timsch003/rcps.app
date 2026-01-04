<script setup lang="ts">
import type { Recipe, IdName } from '../types'

const { recipe } = defineProps<{
  recipe: Recipe
  tags: IdName[]
}>()
</script>

<template>
  <div>{{ recipe.name }}</div>
</template>

<style scoped></style>
