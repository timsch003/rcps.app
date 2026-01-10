<script setup lang="ts">
import { ref } from 'vue'
import AppLogo from '@/components/AppLogo.vue'
import MenuOverlay from '@/components/MenuOverlay.vue'
import ButtonLink from '@/components/ButtonLink.vue'
import ButtonButton from '@/components/ButtonButton.vue'
import FavoritesIcon from '@/components/icons/IconFavorites.vue'
import TagsIcon from '@/components/icons/IconTags.vue'
import AddIcon from '@/components/icons/IconAdd.vue'
import SearchIcon from '@/components/icons/IconSearch.vue'
import MenuIcon from '@/components/icons/IconMenu.vue'
import { t } from '@/lang/i18n'

const menuOverlayOpen = ref(false)
</script>

<template>
  <MenuOverlay v-model="menuOverlayOpen" />
  <main>
    <header>
      <AppLogo />
      <nav class="top">
        <ButtonButton :icon="SearchIcon" :desc="t('Search')" />
        <ButtonButton :icon="MenuIcon" :desc="t('Menu')" @click="menuOverlayOpen = true" />
      </nav>
    </header>
    <section>
      <RouterView />
    </section>
    <nav class="bottom">
      <ButtonLink routeName="" :icon="FavoritesIcon" :desc="t('Favorites')" />
      <ButtonLink routeName="home" :icon="TagsIcon" :desc="t('Tags')" />
      <ButtonLink routeName="" :icon="AddIcon" :desc="t('Add recipe')" />
    </nav>
  </main>
</template>

<style scoped>
main {
  min-height: calc(100vh - var(--outer-spacing) * 2);
  /* compensate nav.bottom overlap */
  padding-bottom: 100px;
}

section {
  padding: var(--inner-spacing) var(--outer-spacing);
}

header,
nav.top,
nav.bottom {
  display: flex;
  align-items: center;
  padding-block: 6px;
}

header,
nav.bottom {
  z-index: 10;
}

/* ensure nav.top stays behind AppLogo*/
nav.top {
  z-index: -1;
}

header {
  position: sticky;
  inset: 0 0 auto 0;
  border-bottom: var(--nav-border-width) solid var(--bg-lighter);
  padding: var(--outer-spacing) var(--outer-spacing) var(--outer-spacing) var(--outer-spacing);
}

nav.top {
  justify-content: flex-end;
  gap: var(--gap);
  width: 100vw;
}

nav.bottom {
  position: fixed;
  inset: auto 0 0 0;
  justify-content: space-around;
  align-items: flex-start;
  gap: var(--gap);
  border-top: var(--nav-border-width) solid var(--bg-lighter);
  padding: var(--inner-spacing) var(--outer-spacing);
}
</style>
