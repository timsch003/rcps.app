<script setup lang="ts">
import { RouterLink, useRoute } from 'vue-router'
import { t } from '@/lang/i18n'
import { useTagsStore } from '@/stores/tags'
import { useRecipesStore } from '@/stores/recipes'
import IconInline from './IconInline.vue'

const route = useRoute()
const tagsStore = useTagsStore()
const recipesStore = useRecipesStore()

const isRoot = route.name === 'tags'
const isSingleRecipe = route.name === 'recipe'
const tagId = route.params.id as string
const viaTagId = route.params.tag as string
const recipeId = route.params.id as string
</script>

<template>
  <nav v-if="!isRoot">
    <RouterLink :to="{ name: 'tags' }">
      {{ t('Tags') }}
    </RouterLink>
    <span aria-hidden="true">→</span>
    <IconInline icon="tag" inBreadcrumbs v-if="!isSingleRecipe" class="breadcrumbs__shown-tag">{{
      tagsStore.getName(tagId)
      }}</IconInline>
    <RouterLink v-else :to="{ name: 'tag', params: { id: viaTagId } }">
      <IconInline icon="tag" inBreadcrumbs>{{ tagsStore.getName(viaTagId) }}</IconInline>
    </RouterLink>
    <span v-if="isSingleRecipe" aria-hidden="true">→</span>
    <span v-if="isSingleRecipe">
      <h2 class="breadcrumbs__shown-recipe">{{ recipesStore.getName(recipeId) }}</h2>
    </span>
  </nav>
  <div v-else>
    <span class="breadcrumbs__root">
      {{ t('Tags') }}
    </span>
  </div>
</template>

<style scoped>
nav,
div {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.75ch;
  padding-bottom: var(--inner-spacing);
  font-size: 0.9rem;

  a:hover,
  a:active,
  a:focus {
    text-decoration: underline;
    flex-shrink: 0;
  }

  span.breadcrumbs__shown-tag,
  span.breadcrumbs__root,
  h2.breadcrumbs__shown-recipe {
    font-weight: 600;
    font-size: var(--heading-font-size);
  }
}
</style>
