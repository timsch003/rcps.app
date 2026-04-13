<script setup lang="ts">
import SearchIcon from '@/views/icons/IconSearch.vue'
import MenuIcon from '@/views/icons/IconMenu.vue'
import ButtonMulti from './ButtonMulti.vue'
import { t } from '@/lang/i18n'

const menuOverlayOpen = defineModel<boolean>('menuOverlayOpen')
</script>

<template>
  <nav class="top">
    <ButtonMulti :icon="SearchIcon" :desc="t('Search')" />
    <ButtonMulti :icon="MenuIcon" :desc="t('Menu')" @click="menuOverlayOpen = true" />
  </nav>
</template>

<style scoped>
nav.top {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  width: 100vw;
  z-index: -1; /* ensure nav.top stays behind AppLogo*/
  gap: var(--inner-spacing);
}
</style>
