<script setup lang="ts">
import CardsGridCard from './CardsGridCard.vue'
import type { IdName, Recipe } from '../types'

const { recipes, tags } = defineProps<{
  recipes?: Recipe[]
  tags?: IdName[]
}>()
</script>

<template>
  <div v-if="recipes?.length">
    <CardsGridCard v-for="recipe in recipes" :key="recipe.id" :recipe="recipe" />
  </div>
  <div v-if="tags?.length">
    <CardsGridCard v-for="tag in tags" :key="tag.id" :tag="tag" />
  </div>
</template>

<style scoped>
div {
  --min-card-width: 160px;

  display: grid;
  gap: var(--gap);
  grid-template-columns: repeat(auto-fill, minmax(min(var(--min-card-width), 100%), 1fr));
}
</style>
