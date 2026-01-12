<script setup lang="ts">
import { RouterLink } from 'vue-router'

defineProps<{ omitAnimation?: boolean }>()
</script>

<template>
  <RouterLink class="logo" :to="{ name: 'tags' }">
    <h1 aria-label="recipes app" :class="{ anim: !omitAnimation }">
      r<span aria-hidden="true">e</span>c<span aria-hidden="true">i</span>p<span
        aria-hidden="true">e</span>s<span>.</span>app
    </h1>
  </RouterLink>
</template>

<style scoped>
a.logo {
  --base-letter-spacing: -0.05ch;
  background-color: var(--bg);
  padding-right: 4px;

  h1 {
    color: var(--accent);
    font-size: 2rem;
    font-weight: 900;
    letter-spacing: var(--base-letter-spacing);
    transform: translateY(-0.4ex);
    margin: 0;
  }

  h1 span:not(:last-of-type) {
    opacity: 0;
    letter-spacing: -1ch;
  }

  h1.anim span:not(:last-of-type) {
    animation: app-name 4s cubic-bezier(0.5, -0.3, 0.5, 1);
  }

  h1.anim span:last-of-type {
    animation: app-name-dot 4s cubic-bezier(0.5, -0.3, 0.5, 1);
  }

  @media (prefers-reduced-motion: reduce) {
    h1.anim span {
      animation: none;
    }
  }
}

@keyframes app-name {
  0% {
    opacity: 0;
    letter-spacing: -1ch;
  }

  30% {
    opacity: 1;
    letter-spacing: var(--base-letter-spacing);
  }

  75% {
    opacity: 1;
    letter-spacing: var(--base-letter-spacing);
  }

  0% {
    opacity: 0;
    letter-spacing: -1ch;
  }
}

@keyframes app-name-dot {
  0% {
    opacity: 1;
  }

  30% {
    opacity: 0;
  }

  70% {
    opacity: 0;
  }

  0% {
    opacity: 1;
  }
}
</style>
