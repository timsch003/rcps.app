<script setup lang="ts">
import ButtonMulti from '@/views/components/ButtonMulti.vue'
import FavoritesIcon from '@/views/icons/IconFavorites.vue'
import TagsIcon from '@/views/icons/IconTags.vue'
import AddIcon from '@/views/icons/IconAdd.vue'
import LastViewedIcon from '@/views/icons/IconLastViewed.vue'
import { t } from '@/lang/i18n'
</script>

<template>
  <nav class="bottom">
    <ButtonMulti
      route="last"
      :icon="LastViewedIcon"
      :desc="t('Last Viewed')"
      accentColor
      inNavBottom
    />
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
</template>

<style scoped>
nav.bottom {
  display: flex;
  align-items: center;
  justify-content: space-around;
  align-items: flex-start;

  position: fixed;
  inset: auto 0 0 0;

  z-index: 10;
  gap: var(--inner-spacing);
  padding: var(--outer-spacing);
  background-color: var(--bg);
  border-top: var(--nav-border-width) solid var(--bg-lighter);
}
</style>
