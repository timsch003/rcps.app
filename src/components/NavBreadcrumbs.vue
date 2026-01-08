<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { t } from '@/lang/i18n'
import InlineIcon from './InlineIcon.vue'
import type { IdAndName, Recipe } from '../types'

const { origin, recipe, isSingleRecipe } = defineProps<{
  origin: IdAndName
  recipe: Recipe['name']
  isSingleRecipe: boolean
}>()
</script>

<template>
  <nav>
    <RouterLink :to="{ name: 'home' }">
      <InlineIcon icon="tag" inBreadcrumbs>{{ t('Tags') }}</InlineIcon>
    </RouterLink>
    <span aria-hidden="true">→</span>
    <span v-if="!isSingleRecipe" class="shown-tag">{{ origin.name }}</span>
    <a v-else href=""><span>{{ origin.name }}</span>
    </a>
    <span v-if="recipe" aria-hidden="true">→</span>
    <span v-if="recipe">{{ recipe }}</span>
  </nav>
</template>

<style scoped>
nav {
  display: flex;
  align-items: center;
  gap: 0.75ch;
  padding-bottom: var(--inner-spacing);
  font-size: 0.9rem;

  a:hover,
  a:active,
  a:focus {
    text-decoration: underline;
  }

  .shown-tag {
    font-weight: 600;
  }
}
</style>
