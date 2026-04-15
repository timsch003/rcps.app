<script setup lang="ts">
import { inject } from 'vue'
import SearchIcon from '@/views/icons/IconSearch.vue'
import MenuIcon from '@/views/icons/IconMenu.vue'
import SyncedIcon from '@/views/icons/IconSynced.vue'
import SyncOfflineIcon from '@/views/icons/IconSyncOffline.vue'
import SyncPullingIcon from '@/views/icons/IconSyncPulling.vue'
import SyncPushingIcon from '@/views/icons/IconSyncPushing.vue'
import SyncErrorIcon from '@/views/icons/IconSyncError.vue'
import ButtonMulti from './ButtonMulti.vue'
import { sync } from '@/services/sync'
import { t } from '@/lang/i18n'
import type { SyncStatus } from '@/types'

const menuOverlayOpen = defineModel<boolean>('menuOverlayOpen')
const syncStatus: SyncStatus = inject('syncStatus', 'offline')
const syncMap = {
  synced: { icon: SyncedIcon, desc: t('sync.status_synced') },
  offline: { icon: SyncOfflineIcon, desc: t('sync.status_offline') },
  pulling: { icon: SyncPullingIcon, desc: t('sync.status_pulling') },
  pushing: { icon: SyncPushingIcon, desc: t('sync.status_pushing') },
  error: { icon: SyncErrorIcon, desc: t('sync.status_error') },
}
</script>

<template>
  <nav class="top">
    <ButtonMulti
      :icon="syncMap[syncStatus].icon"
      :desc="syncMap[syncStatus].desc"
      @click="sync.init()"
    />
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

:deep(svg[class*='sync--']) {
  stroke: var(--text);
}
:deep(svg.sync--synced) {
  stroke: var(--accent);
}
:deep(svg.sync--offline) {
  stroke: var(--error);
}
:deep(svg.sync--error) {
  stroke: var(--error);
}
</style>
