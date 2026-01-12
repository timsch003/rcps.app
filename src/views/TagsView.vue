<script setup lang="ts">
import CardsGrid from '@/views/components/CardsGrid.vue'
import { useTagsStore } from '@/stores/tags'

const tagsStore = useTagsStore()
</script>

<template>
  <CardsGrid :tags="tagsStore.all" />
</template>
