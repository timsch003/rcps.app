<script setup lang="ts">
import InlineIcon from './InlineIcon.vue'
import type { Tag, Recipe } from '../types'

defineProps<{
  recipe?: Recipe
  tag?: Tag
}>()
</script>

<template>
  <a :class="['card', { 'card--tag': tag }]" :href="tag ? `/tags/${tag.id}/recipes` : `/recipes/${recipe?.id}`">
    <h2 class="heading">{{ tag ? tag.name : recipe?.name }}</h2>
    <div v-if="!tag && recipe?.tags.length" class="card__section">
      <InlineIcon icon="tag">
        {{recipe?.tags.map((c) => c.name).join(', ')}}
      </InlineIcon>
    </div>
  </a>
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
    font-size: 1rem;
  }

  .card__section {
    margin-top: 15px;
    font-size: 0.9rem;
    color: var(--text);
    opacity: var(--secondary-text-opacity);
  }
}

a.card--tag {
  text-align: center;

  h2 {
    font-size: 1.1rem;
    font-weight: 600;
  }
}

.card:hover,
.card:active,
.card:focus {
  box-shadow: 0px 0px var(--bg-lighter);
  transform: translate(0px, 0px);
  transition:
    box-shadow var(--ui-transition-duration) ease-in-out,
    transform var(--ui-transition-duration) ease-in-out;
}
</style>
