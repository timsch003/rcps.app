<script setup lang="ts">
import { RouterLink, useRoute } from 'vue-router'
import { t } from '@/lang/i18n'
import { useTagsStore } from '@/stores/tags'

const route = useRoute()
const tagsStore = useTagsStore()

const tagId = route.params.id as string
</script>

<template>
  <nav class="breadcrumbs">
    <RouterLink :to="{ name: 'tags' }">
      {{ t('Tags') }}
    </RouterLink>
    <span aria-hidden="true">→</span>
    <h2 class="heading--root">{{ tagsStore.getName(tagId) }}</h2>
  </nav>
</template>

<style scoped>
nav {
  h2.heading--root {
    padding-bottom: 0;
  }

  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.75ch;
  padding-bottom: var(--inner-spacing);

  a:hover,
  a:active,
  a:focus {
    text-decoration: underline;
    flex-shrink: 0;
  }
}
</style>
