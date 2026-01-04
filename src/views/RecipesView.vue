<script setup lang="ts">
import CardsGrid from '../components/CardsGrid.vue'
import type { Recipe } from '../types'

const { recipes } = defineProps<{
  recipes: Recipe[]
}>()
</script>

<template>
  <CardsGrid :data="recipes" />
</template>

<style scoped></style>
