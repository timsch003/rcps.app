<script setup lang="ts">
import { ref } from 'vue'
import AppLogo from '@/views/components/AppLogo.vue'
import MenuOverlay from '@/views/components/MenuOverlay.vue'
import ButtonMulti from '@/views/components/ButtonMulti.vue'
import FavoritesIcon from '@/views/icons/IconFavorites.vue'
import TagsIcon from '@/views/icons/IconTags.vue'
import AddIcon from '@/views/icons/IconAdd.vue'
import SearchIcon from '@/views/icons/IconSearch.vue'
import MenuIcon from '@/views/icons/IconMenu.vue'
import { t } from '@/lang/i18n'

const menuOverlayOpen = ref(false)
</script>

<template>
  <MenuOverlay v-model="menuOverlayOpen" />
  <main>
    <header>
      <AppLogo />
      <nav class="top">
        <ButtonMulti :icon="SearchIcon" :desc="t('Search')" />
        <ButtonMulti :icon="MenuIcon" :desc="t('Menu')" @click="menuOverlayOpen = true" />
      </nav>
    </header>
    <section>
      <RouterView />
    </section>
    <nav class="bottom">
      <ButtonMulti
        route="favorites"
        :icon="FavoritesIcon"
        :desc="t('Favorites')"
        accentColor
        inNavBottom
      />
      <ButtonMulti route="tags" :icon="TagsIcon" :desc="t('Tags')" accentColor inNavBottom />
      <ButtonMulti route="create" :icon="AddIcon" :desc="t('Add recipe')" accentColor inNavBottom />
    </nav>
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

header,
nav.top,
nav.bottom {
  display: flex;
  align-items: center;
}

header,
nav.bottom {
  padding: var(--outer-spacing);
}

header,
nav.bottom {
  z-index: 10;
  background-color: var(--bg);
}

/* ensure nav.top stays behind AppLogo*/
nav.top {
  z-index: -1;
}

header {
  position: sticky;
  inset: 0 0 auto 0;
  border-bottom: var(--nav-border-width) solid var(--bg-lighter);
}

nav.top {
  justify-content: flex-end;
  gap: var(--inner-spacing);
  width: 100vw;
}

nav.bottom {
  position: fixed;
  inset: auto 0 0 0;
  justify-content: space-around;
  align-items: flex-start;
  gap: var(--inner-spacing);
  border-top: var(--nav-border-width) solid var(--bg-lighter);
}
</style>
