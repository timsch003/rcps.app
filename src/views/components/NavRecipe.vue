<script setup lang="ts">
import { useRouter } from 'vue-router'
import ButtonMulti from '@/views/components/ButtonMulti.vue'
import ArrowLeftIcon from '@/views/icons/IconArrowLeft.vue'
import { t } from '@/lang/i18n'

const router = useRouter()
</script>

<template>
  <nav class="recipe">
    <ButtonMulti @click="router.back()" :icon="ArrowLeftIcon" :desc="t('Back')" accentColor />
  </nav>
</template>

<style scoped>
nav.recipe {
  display: flex;

  position: fixed;
  inset: auto 0 0 auto;

  z-index: 10;
  gap: var(--inner-spacing);
  padding: var(--outer-spacing);
  border-radius: var(--border-radius) var(--border-radius) 0 0;
}
</style>
