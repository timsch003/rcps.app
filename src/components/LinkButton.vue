<script setup lang="ts">
import { RouterLink } from 'vue-router'

defineProps({
  href: { type: String, required: true },
  icon: { type: Object, required: false },
  desc: { type: String, required: true },
  showDesc: { type: Boolean, required: false, default: false },
})
</script>

<template>
  <div v-if="icon" class="link-button">
    <RouterLink :to="href" :aria-label="desc">
      <component v-if="icon" :is="icon" />
    </RouterLink>
    <span class="link-button__desc" v-if="showDesc">
      {{ desc }}
    </span>
  </div>
  <div v-else class="link-button">
    <RouterLink :to="href" :aria-label="desc">
      {{ desc }}
    </RouterLink>
  </div>
</template>

<style scoped>
.link-button {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex-shrink: 0;
  font-size: 0.9rem;
  font-weight: 200;
}

span.link-button__desc {
  opacity: var(--secondary-text-opacity);
  margin-top: 2px;
}

a {
  background-color: var(--bg-light);
  box-shadow: 2px 2px var(--bg-lighter);
  border-radius: 10em;
  font-weight: 600;
  transform: translate(-1px, -1px);
  padding: 6px 12px;

  svg {
    width: 2rem;
    height: 1.5rem;
  }
}

a:hover,
a:active,
a:focus {
  background-color: var(--bg-lighter);
  box-shadow: 0px 0px var(--bg-lighter);
  transform: translate(0px, 0px);
  transition:
    box-shadow var(--ui-transition-duration) ease-in-out,
    transform var(--ui-transition-duration) ease-in-out;
}
</style>
