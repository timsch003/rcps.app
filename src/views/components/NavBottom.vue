<script setup lang="ts">
import { ref, watch } from 'vue'
import { onClickOutside } from '@vueuse/core'
import { useRoute } from 'vue-router'
import ButtonMulti from '@/views/components/ButtonMulti.vue'
import IconInline from '@/views/components/IconInline.vue'
import { t } from '@/lang/i18n'
import FavoritesIcon from '@/views/icons/IconFavorites.vue'
import TagsIcon from '@/views/icons/IconTags.vue'
import AddIcon from '@/views/icons/IconAdd.vue'
import LastViewedIcon from '@/views/icons/IconLastViewed.vue'
import ArrowDownIcon from '@/views/icons/IconArrowDown.vue'

const route = useRoute()
const createDrawerVisible = ref(false)
const createDrawerElement = ref<HTMLElement | null>(null)

onClickOutside(createDrawerElement, (event) => {
  const target = event.target as HTMLElement | null
  if (target?.closest('.bottom__create-toggle')) return
  createDrawerVisible.value = false
})

watch(
  () => route.fullPath,
  () => {
    createDrawerVisible.value = false
  },
)

function toggleCreateDrawer() {
  createDrawerVisible.value = !createDrawerVisible.value
}
</script>

<template>
  <nav class="bottom">
    <ButtonMulti
      route="last"
      :icon="LastViewedIcon"
      :desc="t('Last viewed')"
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
    <ButtonMulti
      route="tags"
      :icon="TagsIcon"
      :desc="t('Tags')"
      accentColor
      inNavBottom
      :class="route.name === 'tag' ? 'active' : ''"
    />
    <ButtonMulti
      :icon="AddIcon"
      :desc="t('Create recipe')"
      accentColor
      inNavBottom
      class="bottom__create-toggle"
      @click="toggleCreateDrawer"
    />
    <div
      ref="createDrawerElement"
      class="bottom__create-drawer"
      :class="{ 'bottom__create-drawer--open': createDrawerVisible }"
    >
      <div class="bottom__create-drawer-content">
        <h3 class="heading--muted">
          {{ t('create_drawer.heading') }}
          <ButtonMulti
            :icon="ArrowDownIcon"
            :desc="t('Close')"
            inline
            @click="toggleCreateDrawer"
          />
        </h3>
        <ButtonMulti route="create" :desc="t('create_drawer.manual')" smallText accentColor />
        <ButtonMulti
          route="create-from-images"
          :desc="t('create_drawer.from_image')"
          smallText
          accentColor
        />
      </div>
    </div>
  </nav>
</template>

<style scoped>
nav.bottom {
  justify-content: space-around;
  align-items: flex-start;
  gap: var(--inner-spacing);
  position: fixed;
  inset: auto 0 0 0;
  z-index: 10;
  padding: var(--outer-spacing);
}

nav.bottom,
div.bottom__create-drawer {
  display: flex;
  background-color: var(--bg);
  border-top: var(--nav-border-width) solid var(--bg-lighter);
}

div.bottom__create-drawer {
  position: absolute;
  z-index: 11;
  inset: auto 0 0 auto;
  clip-path: inset(100% 0px 0px 0px);
  pointer-events: none;
  transition: clip-path var(--transition-duration);
  padding: var(--inner-spacing);
  border-left: var(--nav-border-width) solid var(--bg-lighter);

  h3 {
    display: flex;
    justify-content: space-between;
    gap: var(--inner-spacing);
  }
}

div.bottom__create-drawer.bottom__create-drawer--open {
  clip-path: inset(0px 0px 0px 0px);
  pointer-events: auto;
}

div.bottom__create-drawer h3,
div.bottom__create-drawer a {
  margin-bottom: var(--inner-spacing);
}
</style>
