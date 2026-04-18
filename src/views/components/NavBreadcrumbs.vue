<script setup lang="ts">
import { RouterLink, useRoute } from 'vue-router'
import { t } from '@/lang/i18n'
import { useTagsStore } from '@/stores/tags'

const props = defineProps<{
  viewType: string
}>()

const route = useRoute()
const tagsStore = useTagsStore()

const isTagsView = props.viewType === 'tag'
const tagId = route.params.id as string

let viewName: string
switch (props.viewType) {
  case 'tag':
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
    <h2 class="heading--root">
      <RouterLink v-if="isTagsView" :to="{ name: 'tags' }"> {{ t(viewName) }}&nbsp;</RouterLink>
      <span v-if="isTagsView" aria-hidden="true">→</span>
      {{ isTagsView ? tagsStore.getName(tagId) : t(viewName) }}
    </h2>
  </nav>
</template>

<style scoped>
nav {
  h2.heading--root {
    padding-bottom: 0;

    span {
      margin-inline: 5px;
    }
  }

  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.75ch;
  padding-bottom: var(--inner-spacing);
}
</style>
