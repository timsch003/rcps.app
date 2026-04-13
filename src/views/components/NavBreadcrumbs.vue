<script setup lang="ts">
import { RouterLink, useRoute } from 'vue-router'
import { t } from '@/lang/i18n'
import { useTagsStore } from '@/stores/tags'

const props = defineProps<{
  viewType: string
}>()

const route = useRoute()
const tagsStore = useTagsStore()

const isTagsView = props.viewType === 'tags'
const tagId = route.params.id as string

let viewName: string
switch (props.viewType) {
  case 'tags':
    viewName = 'Tags'
    break
  case 'last':
    viewName = 'Last viewed'
    break
  case 'favorites':
    viewName = 'Favorites'
    break
  default:
    viewName = ''
}
</script>

<template>
  <nav class="breadcrumbs">
    <RouterLink v-if="isTagsView" :to="{ name: 'tags' }">
      {{ t(viewName) }}
    </RouterLink>
    <span v-if="isTagsView" aria-hidden="true">→</span>
    <h2 class="heading--root">{{ isTagsView ? tagsStore.getName(tagId) : t(viewName) }}</h2>
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
