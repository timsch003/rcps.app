<script setup lang="ts">
import { RouterLink, useRoute } from 'vue-router'
import { useTagsStore } from '@/stores/tags'
import IconInline from './IconInline.vue'
import type { Tag, RecipeLocal } from '@/types'

defineProps<{
  recipe?: RecipeLocal
  tag?: Tag
}>()

const route = useRoute()
const tagsStore = useTagsStore()
</script>

<template>
  <RouterLink v-if="recipe" class="card" :to="{ name: 'recipe', params: { id: recipe?.id } }">
    <h2 class="heading">{{ recipe?.name }}</h2>
    <div class="card__section">
      <IconInline v-if="!!recipe.tagIds" icon="tag">
        {{ tagsStore.getNames(recipe.tagIds).join(', ') }}
      </IconInline>
    </div>
  </RouterLink>
  <RouterLink v-else class="card card--tag" :to="{ name: 'tag', params: { id: tag?.id } }">
    <h2 class="heading">
      <IconInline icon="tag" />{{ tag?.name }}
    </h2>
  </RouterLink>
</template>

<style scoped>
a.card {
  background-color: var(--bg-light);
  box-shadow: 2px 2px var(--bg-lighter);
  transform: translate(-1px, -1px);
  border-radius: var(--border-radius);
  padding: 8px 14px;

  h2 {
    font-weight: 600;
    font-size: var(--heading-font-size);
  }

  .card__section {
    margin-top: 15px;
    font-size: 0.9rem;
    color: var(--text);
    opacity: var(--text-secondary-opacity);
  }
}

a.card--tag {
  text-align: center;

  h2 {
    font-size: var(--heading-font-size);
    font-weight: 600;
  }
}

.card:hover,
.card:active,
.card:focus {
  box-shadow: 0px 0px var(--bg-lighter);
  transform: translate(0px, 0px);
  transition:
    box-shadow var(--transition-duration) ease-in-out,
    transform var(--transition-duration) ease-in-out;
}
</style>
