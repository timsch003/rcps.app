<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'
import { useScroll } from '@vueuse/core'
import ButtonMulti from '@/views/components/ButtonMulti.vue'
import ArrowLeftIcon from '@/views/icons/IconArrowLeft.vue'
import EditIcon from '@/views/icons/IconEdit.vue'
import { t } from '@/lang/i18n'

const route = useRoute()
const router = useRouter()
const { isScrolling } = useScroll(window)

function edit() {
  router.replace({ name: 'editRecipe', params: { id: route.params.id } })
}
</script>

<template>
  <nav class="recipe" :class="{ scrolling: isScrolling }">
    <ButtonMulti @click="router.back()" :icon="ArrowLeftIcon" :desc="t('Back')" accentColor small />
    <ButtonMulti @click="edit()" :icon="EditIcon" :desc="t('Edit recipe')" accentColor small />
  </nav>
</template>

<style scoped>
nav.recipe {
  display: flex;

  position: fixed;
  inset: auto 0 0 auto;

  z-index: 9;
  gap: var(--inner-spacing);
  padding: var(--outer-spacing);
  border-radius: var(--border-radius) var(--border-radius) 0 0;
}

nav {
  opacity: var(--over-text-button-opacity);
  transition: opacity var(--transition-duration);
}
nav:hover,
nav:focus,
nav:active,
nav.scrolling {
  opacity: 1;
}
</style>
