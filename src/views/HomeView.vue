<script setup lang="ts">
import CardsGrid from '@/views/components/CardsGrid.vue'

import type { IdAndName } from '../types'

defineProps<{ tags: IdAndName[] }>()
</script>

<template>
  <CardsGrid :tags="tags" />
</template>
