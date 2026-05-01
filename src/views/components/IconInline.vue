<script setup lang="ts">
defineProps<{
  icon: object
  desc: string
  spaceBefore?: boolean | false
}>()
</script>

<template>
  <span
    >{{ spaceBefore ? ' ' : '' }}<span><component :is="icon" :aria-label="desc" /></span
    >{{ !spaceBefore ? ' ' : '' }}
    <slot />
  </span>
</template>

<style scoped>
span > span {
  display: inline-block;
  max-width: 1em;
  max-height: 1em;
}
</style>
