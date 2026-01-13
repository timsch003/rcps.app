<script setup lang="ts">
import { useRoute } from 'vue-router'
import { useRecipesStore } from '@/stores/recipes'
import CardsGrid from '@/views/components/CardsGrid.vue'
import NavBreadcrumbs from './components/NavBreadcrumbs.vue'

const route = useRoute()
const recipesStore = useRecipesStore()
</script>

<template>
  <NavBreadcrumbs />
  <CardsGrid :recipes="recipesStore.getAllWithTag(route.params.id as string)" />
</template>

<style scoped></style>
