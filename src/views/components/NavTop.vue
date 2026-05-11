<script setup lang="ts">
import { sync } from '@/services/sync'
import { useSyncStore } from '@/stores/sync_status'
import ButtonMulti from './ButtonMulti.vue'
import { t } from '@/lang/i18n'
import SearchIcon from '@/views/icons/IconSearch.vue'
import MenuIcon from '@/views/icons/IconMenu.vue'
import SyncedIcon from '@/views/icons/IconSynced.vue'
import SyncOfflineIcon from '@/views/icons/IconSyncOffline.vue'
import SyncUnsyncedIcon from '@/views/icons/IconSyncUnsynced.vue'
import SyncUnsyncedOfflineIcon from '@/views/icons/IconSyncUnsyncedOffline.vue'
import SyncPullingIcon from '@/views/icons/IconSyncPulling.vue'
import SyncPushingIcon from '@/views/icons/IconSyncPushing.vue'
import SyncErrorIcon from '@/views/icons/IconSyncError.vue'

const syncStore = useSyncStore()
const menuOverlayOpen = defineModel<boolean>('menuOverlayOpen')
const syncMap = {
  synced: { icon: SyncedIcon, desc: t('sync.status_synced') },
  offline: { icon: SyncOfflineIcon, desc: t('sync.status_offline') },
  unsynced: { icon: SyncUnsyncedIcon, desc: t('sync.status_unsynced') },
  'unsynced-offline': { icon: SyncUnsyncedOfflineIcon, desc: t('sync.status_unsynced_offline') },
  pulling: { icon: SyncPullingIcon, desc: t('sync.status_pulling') },
  pushing: { icon: SyncPushingIcon, desc: t('sync.status_pushing') },
  error: { icon: SyncErrorIcon, desc: t('sync.status_error') },
}

async function triggerSync() {
  if (
    syncStore.status !== 'pushing' &&
    syncStore.status !== 'pulling' &&
    syncStore.status !== 'offline'
  )
    void sync.trigger()
}
</script>

<template>
  <nav class="top">
    <div
      class="sync-indicator"
      :icon="syncMap[syncStore.status].icon"
      :aria-label="syncMap[syncStore.status].desc"
      tabindex="0"
      @click="triggerSync"
    >
      <component :is="syncMap[syncStore.status].icon" :key="syncStore.status" />
    </div>
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

.sync-indicator {
  margin: 0 auto;
  cursor: pointer;
  padding: 10px;
  border-radius: 50%;
}

.sync-indicator:has(svg.sync--offline),
.sync-indicator svg.sync--offline {
  cursor: not-allowed;
}

svg[class*='sync--'] {
  stroke: var(--text);
  width: 1.65rem;
  height: 1.65rem;
}

svg.sync--synced {
  stroke: var(--accent);
}

svg.sync--offline,
svg.sync--unsynced,
svg.sync--unsynced-offline {
  stroke: var(--warning);
}

svg.sync--error {
  stroke: var(--error);
}
</style>
