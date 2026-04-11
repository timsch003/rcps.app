<script setup lang="ts">
import CardsGrid from '@/views/components/CardsGrid.vue'
import { useTagsStore } from '@/stores/tags'

const tagsStore = useTagsStore()
</script>

<template>
  <h2 class="heading--root">{{ $t('Tags') }}</h2>
  <CardsGrid :tags="tagsStore.cached" />
</template>
