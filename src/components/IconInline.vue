<script setup lang="ts">
import TagsIcon from './icons/IconTags.vue'
import { t } from '@/lang/i18n'

defineProps({
  icon: {
    type: String,
    required: true,
  },
  inBreadcrumbs: {
    type: Boolean,
    default: false,
  },
})
</script>

<template>
  <span :class="inBreadcrumbs ? 'breadcrumb-icon' : ''">
    <TagsIcon :aria-label="t('Tags')" />
    <slot />
  </span>
</template>

<style scoped>
svg {
  width: var(--icon-size);
  height: var(--icon-size);
  display: inline-flex;
  margin-right: 6px;
  transform: translateY(3px);
}

.breadcrumb-icon {
  display: flex;
  align-items: center;

  svg {
    transform: translateY(0px);
    margin-right: 3px;
  }
}
</style>
