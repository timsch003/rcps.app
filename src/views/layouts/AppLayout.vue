<script setup lang="ts">
import { reactive } from 'vue'
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
    <Transition name="slide-out-top" mode="out-in">
      <header v-if="$route.name !== 'recipe'">
        <AppLogo omitAnimation />
        <NavTop v-model:menuOverlayOpen="menuOverlayOpen.value" />
      </header>
    </Transition>
    <section>
      <RouterView :key="$route.name" />
    </section>
    <Transition name="slide-out-bottom" mode="out-in">
      <NavBottom v-if="$route.name !== 'recipe'" />
      <NavRecipe v-else />
    </Transition>
  </main>
</template>

<style scoped>
main {
  min-height: 100vh;
  /* compensate nav.bottom overlapping content */
  padding-bottom: 100px;
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
