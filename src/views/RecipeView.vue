<script setup lang="ts">
import NavBreadcrumbs from '../components/NavBreadcrumbs.vue'
import type { Recipe, Tag } from '../types'

const { recipe } = defineProps<{
  recipe: Recipe
  tags: Tag[]
}>()
</script>

<template>
  <NavBreadcrumbs origin="placeholder-tag" :recipe="recipe.name" isSingleRecipe />
</template>

<style scoped></style>
