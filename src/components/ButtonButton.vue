<script setup lang="ts">
defineProps({
  icon: { type: Object, required: false },
  desc: { type: String, required: true },
  showDesc: { type: Boolean, required: false, default: false },
})
</script>

<template>
  <button v-if="icon && showDesc" class="action-button--icon-desc" :aria-label="desc" role="button">
    <component :is="icon" />
    <span class="action-button__desc">{{ desc }}</span>
  </button>
  <button v-else-if="icon && !showDesc" class="action-button" :aria-label="desc" role="button">
    <component :is="icon" />
  </button>
  <button v-else class="action-button" :aria-label="desc" role="button">
    {{ desc }}
  </button>
</template>

<style scoped>
button.action-button,
button.action-button--icon-desc {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  font-size: 0.9rem;
  font-weight: 200;
  background-color: var(--bg-light);
  box-shadow: 2px 2px var(--bg-lighter);
  border: none;
  border-radius: 10em;
  font-weight: 600;
  transform: translate(-1px, -1px);
  padding: 6px 12px;
  color: var(--accent);
  cursor: pointer;

  svg {
    display: inline-flex;
    width: var(--icon-size);
    height: var(--icon-size);
  }
}

button.action-button--icon-desc svg {
  width: var(--icon-size-s);
  height: var(--icon-size-s);
}

span.action-button__desc {
  opacity: var(--secondary-text-opacity);
  margin-left: var(--gap);
}

button.action-button:hover,
button.action-button--icon-desc:hover {
  background-color: var(--bg-lighter);
}

button.action-button:active,
button.action-button:focus,
button.action-button--icon-desc:active,
button.action-button--icon-desc:focus {
  background-color: var(--bg-lighter);
  box-shadow: 0px 0px var(--bg-lighter);
  transform: translate(1px, 1px);
  transition:
    box-shadow var(--transition-duration) ease-in-out,
    transform var(--transition-duration) ease-in-out;
}
</style>
