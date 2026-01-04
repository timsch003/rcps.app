<script setup lang="ts">
import CardsGrid from '../components/CardsGrid.vue'

import type { IdName } from '../types'

defineProps<{ tags: IdName[] }>()
</script>

<template>
  <CardsGrid :tags="tags" />
</template>
