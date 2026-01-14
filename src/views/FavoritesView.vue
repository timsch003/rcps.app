<script setup lang="ts">
import { useRecipesStore } from '@/stores/recipes'
import CardsGrid from '@/views/components/CardsGrid.vue'
import NavBreadcrumbs from './components/NavBreadcrumbs.vue'

const recipesStore = useRecipesStore()
</script>

<template>
  <NavBreadcrumbs />
  <CardsGrid :recipes="recipesStore.all" />
</template>

<style scoped></style>
