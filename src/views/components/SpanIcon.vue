<script setup lang="ts">
defineProps<{
  icon: object
  desc: string
}>()
</script>

<template>
  <span>
    <component :is="icon" :aria-label="desc" />
    <slot />
  </span>
</template>

<style scoped>
svg {
  width: var(--icon-size-xs);
  height: var(--icon-size-xs);
  display: inline-flex;
  margin-right: 6px;
  transform: translateY(3px);
}
</style>
