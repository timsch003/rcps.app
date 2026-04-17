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
    <div
      :class="['sync-indicator', `sync--${syncStatus}`]"
      :icon="syncMap[syncStatus].icon"
      :aria-label="syncMap[syncStatus].desc"
      tabindex="0"
      @click="
        syncStatus === 'offline' || syncStatus === 'error' || syncStatus === 'synced'
          ? sync.init()
          : null
      "
    >
      <Transition name="status-change" mode="out-in">
        <component :is="syncMap[syncStatus].icon" />
      </Transition>
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
  --anim-scale-factor: 1.6;

  .sync--pulling,
  .sync--pushing {
    animation: pulse 1s ease-in-out var(--transition-duration) infinite;
  }
}

.status-change-enter-active,
.status-change-leave-active {
  transition:
    opacity var(--transition-duration),
    transform var(--transition-duration);
}
.status-change-enter-from,
.status-change-leave-to {
  opacity: 0;
  transform: scale(var(--anim-scale-factor));
}

svg[class*='sync--'] {
  stroke: var(--text);
}
svg.sync--synced {
  stroke: var(--accent);
}
svg.sync--offline {
  stroke: var(--error);
}
svg.sync--error {
  stroke: var(--error);
}

@keyframes pulse {
  0% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(var(--anim-scale-factor));
    opacity: 0.4;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}
</style>
