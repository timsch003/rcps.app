<script setup lang="ts">
import { useRecipesStore } from '@/stores/recipes'
import CardsGrid from '@/views/components/CardsGrid.vue'

const recipesStore = useRecipesStore()
</script>

<template>
  <h2 class="heading--root">{{ $t('Favorites') }}</h2>
  <CardsGrid :recipes="recipesStore.all" />
</template>

<style scoped></style>
