<script setup lang="ts">
import CardsGrid from '@/views/components/CardsGrid.vue'
import { useTagsStore } from '@/stores/tags'
import NavBreadcrumbs from './components/NavBreadcrumbs.vue'

const tagsStore = useTagsStore()
</script>

<template>
  <NavBreadcrumbs />
  <CardsGrid :tags="tagsStore.all" />
</template>
