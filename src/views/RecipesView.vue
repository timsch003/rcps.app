<script setup lang="ts">
import { useRoute } from 'vue-router'
import { useRecipesStore } from '@/stores/recipes'
import CardsGrid from '@/views/components/CardsGrid.vue'

const route = useRoute()
const recipesStore = useRecipesStore()
</script>

<template>
  <CardsGrid :recipes="recipesStore.getAllWithTag(route.params.id as string)" />
</template>

<style scoped></style>
