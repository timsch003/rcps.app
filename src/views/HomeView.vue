<script setup lang="ts">
import CardsGrid from '../components/CardsGrid.vue'

import type { Tag } from '../types'

withDefaults(defineProps<{ tags: Tag[] }>(), {
  tags: () => [
    { id: 1, name: 'Dessert' },
    { id: 2, name: 'Vegetarian' },
    { id: 3, name: 'Quick & Easy' },
  ],
})
</script>

<template>
  <CardsGrid :tags />
</template>
