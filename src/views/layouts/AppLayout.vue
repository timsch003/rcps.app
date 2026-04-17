<script setup lang="ts">
import { reactive } from 'vue'
import { useRoute } from 'vue-router'
import AppLogo from '@/views/components/AppLogo.vue'
import MenuOverlay from '@/views/components/MenuOverlay.vue'
import NavTop from '@/views/components/NavTop.vue'
import NavBottom from '@/views/components/NavBottom.vue'
import NavRecipe from '@/views/components/NavRecipe.vue'

const menuOverlayOpen = reactive({ value: false })
</script>

<template>
  <MenuOverlay v-model="menuOverlayOpen.value" />
  <main>
    <header v-if="$route.name !== 'recipe'">
      <AppLogo omitAnimation />
      <NavTop v-model:menuOverlayOpen="menuOverlayOpen.value" />
    </header>
    <section>
      <RouterView :key="$route.name" />
    </section>
    <NavBottom v-if="$route.name !== 'recipe'" />
    <NavRecipe v-else />
  </main>
</template>

<style scoped>
main {
  min-height: calc(100vh - var(--outer-spacing) * 2);
  /* compensate nav.bottom overlapping content */
  padding-bottom: 80px;
}

section {
  padding: var(--inner-spacing) var(--outer-spacing);
}

header {
  display: flex;
  align-items: center;
  padding: var(--outer-spacing);

  position: sticky;
  inset: 0 0 auto 0;

  z-index: 10;
  background-color: var(--bg);
  border-bottom: var(--nav-border-width) solid var(--bg-lighter);
}
</style>
