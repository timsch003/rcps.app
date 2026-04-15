<script setup lang="ts">
import { useTagsStore } from '@/stores/tags'
import { t } from '@/lang/i18n'
import CardsGrid from '@/views/components/CardsGrid.vue'

const tagsStore = useTagsStore()
</script>

<template>
  <h2 class="heading--root">{{ t('Tags') }}</h2>
  <CardsGrid :tags="tagsStore.cached" />
</template>
