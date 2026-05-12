<script setup lang="ts">
import { RouterLink } from 'vue-router'
import IconInline from '@/views/components/IconInline.vue'
import TagsIcon from '@/views/icons/IconTags.vue'
import { t } from '@/lang/i18n'
import type { Tag, RecipeLocal } from '@/types'

defineProps<{
  recipe?: RecipeLocal
  tag?: Tag
}>()
</script>

<template>
  <RouterLink
    v-if="recipe"
    class="card card__recipe"
    :to="{ name: 'recipe', params: { id: recipe?.id } }"
  >
    <div class="card__recipe--overlay">
      <h2 class="heading">{{ recipe?.name }}</h2>
    </div>
  </RouterLink>
  <RouterLink v-else class="card card__tag" :to="{ name: 'tag', params: { id: tag?.id } }">
    <h2 class="heading">
      <IconInline
        v-if="tag?.name !== '---untagged---'"
        :icon="TagsIcon"
        :desc="t('Tags')"
        space="before"
        >{{ tag?.name }}</IconInline
      >
      <span class="card__tag--untagged" v-else>{{ t('Untagged') }}</span>
    </h2>
  </RouterLink>
</template>

<style scoped>
a.card {
  background-color: var(--bg-light);
  box-shadow: 2px 2px var(--bg-lighter);
  transform: translate(-1px, -1px);
  border-radius: var(--border-radius);
  padding: var(--card-padding-block) var(--card-padding-inline);
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

a.card h2 {
  font-weight: 600;
  font-size: var(--heading-secondary-font-size);
}

a.card__recipe {
  padding: 0;
  min-height: 20vh;
  background: url('@/assets/images/example-landscape.jpg') no-repeat center/cover;

  h2 {
    padding: 3px 9px 6px 9px;
    background-color: var(--bg);
    opacity: var(--secondary-opacity);
  }
}

a.card__tag {
  padding: 6px;
  display: flex;
  align-items: center;
  justify-content: center;

  h2 {
    text-align: center;
  }
}

.card__tag--untagged {
  font-weight: 300;
}
</style>
