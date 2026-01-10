<script setup lang="ts">
defineProps({
  icon: { type: Object, required: false },
  desc: { type: String, required: true },
  showDesc: { type: Boolean, required: false, default: false },
})
</script>

<template>
  <div v-if="showDesc" class="action-button" :aria-label="desc">
    <component :is="icon" />
    <span class="action-button__desc">{{ desc }}</span>
  </div>
  <div v-else class="action-button" :aria-label="desc">
    <component :is="icon" />
  </div>
</template>

<style scoped>
div.action-button {
  display: flex;
  align-items: center;
  flex-shrink: 0;
  font-size: 0.9rem;
  font-weight: 200;
  background-color: var(--bg-light);
  box-shadow: 2px 2px var(--bg-lighter);
  border-radius: 10em;
  font-weight: 600;
  transform: translate(-1px, -1px);
  padding: 6px 12px;
  cursor: pointer;
  user-select: none;
  color: var(--accent);

  svg {
    display: inline-flex;
    width: var(--icon-size);
    height: var(--icon-size);
  }
}

span.action-button__desc {
  opacity: var(--secondary-text-opacity);
  margin-left: 6px;
}

div.action-button:hover {
  background-color: var(--bg-lighter);
}

div.action-button:active,
div.action-button:focus {
  background-color: var(--bg-lighter);
  box-shadow: 0px 0px var(--bg-lighter);
  transform: translate(1px, 1px);
  transition:
    box-shadow var(--ui-transition-duration) ease-in-out,
    transform var(--ui-transition-duration) ease-in-out;
}
</style>
