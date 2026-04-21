<script setup lang="ts">
import { provide } from 'vue'
import { sync } from '@/services/sync'
import { useSettingsStore } from './stores/settings'
const syncStatus = sync.status
provide('syncStatus', syncStatus)

// Tell browser extension Dark Reader to ignore page if dark mode enabled
if (useSettingsStore().theme === 'dark') {
  const lock = document.createElement('meta')
  lock.name = 'darkreader-lock'
  document.head.appendChild(lock)
}
</script>

<template>
  <RouterView />
</template>
