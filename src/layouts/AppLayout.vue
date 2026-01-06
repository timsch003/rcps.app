<script setup lang="ts">
import AppLogo from '../components/AppLogo.vue'
import LinkButton from '../components/LinkButton.vue'
import FavoritesIcon from '../components/icons/IconFavorites.vue'
import HomeIcon from '../components/icons/IconHome.vue'
import SettingsIcon from '../components/icons/IconSettings.vue'
import SearchIcon from '../components/icons/IconSearch.vue'
import MenuIcon from '../components/icons/IconMenu.vue'
import { t } from '@/lang/i18n'
</script>

<template>
  <main>
    <header>
      <AppLogo />
      <nav class="top">
        <LinkButton href="#" :icon="SearchIcon" :desc="t('Search')" />
        <LinkButton href="#" :icon="MenuIcon" :desc="t('Menu')" />
      </nav>
    </header>
    <section>
      <RouterView />
    </section>
    <nav class="bottom">
      <LinkButton href="#" :icon="FavoritesIcon" :desc="t('Favorites')" show-desc />
      <LinkButton href="/" :icon="HomeIcon" :desc="t('Home')" show-desc />
      <LinkButton href="#" :icon="SettingsIcon" :desc="t('Settings')" show-desc />
    </nav>
  </main>
</template>

<style scoped>
main {
  --nav-border-width: 2px;

  min-height: calc(100vh - var(--outer-spacing) * 2);
  padding-bottom: 100px;
  /* compensate nav.bottom overlap */
}

section {
  padding: var(--inner-spacing) var(--outer-spacing);
}

header,
nav.top,
nav.bottom {
  display: flex;
  align-items: center;
  background-color: var(--bg);
}

header,
nav.bottom {
  z-index: 10;
}

nav.top {
  z-index: -1;
}

header {
  position: sticky;
  inset: 0 0 auto 0;
  background-color: var(--bg);
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
  gap: var(--gap);
  border-top: var(--nav-border-width) solid var(--bg-lighter);
  padding: var(--inner-spacing) var(--outer-spacing);
  /* compensate border and text having more height: */
  padding-bottom: calc(var(--inner-spacing) - 5px);
}
</style>
