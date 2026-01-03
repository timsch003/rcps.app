<script setup lang="ts">
import NavBreadcrumbs from '../components/NavBreadcrumbs.vue'
import CardsGrid from '../components/CardsGrid.vue'
import type { Tag, Recipe } from '../types'

const { recipes, tag } = defineProps<{
  recipes: Recipe[]
  tag: Tag
}>()
</script>

<template>
  <NavBreadcrumbs :origin="tag" />
  <CardsGrid :data="recipes" />
</template>

<style scoped></style>
