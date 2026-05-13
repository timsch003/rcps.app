<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'
import { useScroll } from '@vueuse/core'
import ButtonMulti from '@/views/components/ButtonMulti.vue'
import ArrowLeftIcon from '@/views/icons/IconArrowLeft.vue'
import EditIcon from '@/views/icons/IconEdit.vue'
import { t } from '@/lang/i18n'

const route = useRoute()
const router = useRouter()
const { isScrolling } = useScroll(window, { behavior: 'smooth' })
</script>

<template>
  <nav class="recipe" :class="{ scrolling: isScrolling }">
    <ButtonMulti
      @click="router.push(route.meta.fromPath || { name: 'tags' })"
      :icon="ArrowLeftIcon"
      :desc="t('Back')"
      accentColor
      smallIcon
    />
    <ButtonMulti
      @click="router.replace({ name: 'edit', params: { id: route.params.id } })"
      :icon="EditIcon"
      :desc="t('Edit recipe')"
      accentColor
      smallIcon
    />
  </nav>
</template>

<style scoped>
nav {
  display: flex;
  flex-direction: column;

  position: fixed;
  inset: 0 0 auto auto;

  z-index: 9;
  gap: var(--inner-spacing);
  padding: var(--outer-spacing);
  border-radius: var(--border-radius) var(--border-radius) 0 0;
}

nav {
  opacity: var(--secondary-opacity);
  transition: all var(--transition-duration);
}
nav:hover,
nav:focus,
nav:active,
nav.scrolling {
  opacity: 1;
}
</style>
