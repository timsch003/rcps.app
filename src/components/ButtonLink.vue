<script setup lang="ts">
import { RouterLink } from 'vue-router'

defineProps({
  routeName: { type: String, required: true },
  icon: { type: Object, required: false },
  desc: { type: String, required: true },
  showDesc: { type: Boolean, required: false, default: false },
})
</script>

<template>
  <div v-if="icon" class="button-link">
    <RouterLink :to="{ name: routeName }" :aria-label="desc">
      <component v-if="icon" :is="icon" />
    </RouterLink>
    <span class="button-link__desc" v-if="showDesc">
      {{ desc }}
    </span>
  </div>
  <div v-else class="button-link">
    <RouterLink :to="{ name: routeName }" :aria-label="desc">
      {{ desc }}
    </RouterLink>
  </div>
</template>

<style scoped>
.button-link {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex-shrink: 0;
  font-size: 0.9rem;
  font-weight: 200;
}

span.button-link__desc {
  opacity: var(--secondary-text-opacity);
  margin-top: 2px;
  max-width: min-content;
  text-align: center;
}

a {
  background-color: var(--bg-light);
  box-shadow: 2px 2px var(--bg-lighter);
  border-radius: 10em;
  font-weight: 600;
  transform: translate(-1px, -1px);
  padding: 6px 12px;

  svg {
    width: var(--icon-size);
    height: var(--icon-size);
  }
}

a:hover {
  background-color: var(--bg-lighter);
}

a:active,
a:focus {
  background-color: var(--bg-lighter);
  box-shadow: 0px 0px var(--bg-lighter);
  transform: translate(1px, 1px);
  transition:
    box-shadow var(--transition-duration) ease-in-out,
    transform var(--transition-duration) ease-in-out;
}
</style>
