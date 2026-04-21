import { defineStore } from 'pinia'
import { ref } from 'vue'
import { sync } from '@/services/sync'
import type { UserSettings } from '@/types'

const STORAGE_KEY = 'rcps-app-settings'

export const useSettingsStore = defineStore('settings', () => {
  const settings = ref<UserSettings>(readFromStorage())

  function readFromStorage(): UserSettings {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      return raw ? JSON.parse(raw) : {}
    } catch {
      return {}
    }
  }

  function update(patch: Partial<UserSettings>) {
    settings.value = { ...settings.value, ...patch }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings.value))
    sync.pushLocalChanges()

    // Tell browser extension Dark Reader to ignore page if dark mode enabled
    if (settings.value.theme === 'dark') {
      const lock = document.createElement('meta')
      lock.name = 'darkreader-lock'
      document.head.appendChild(lock)
    } else {
      const lock = document.querySelector('meta[name="darkreader-lock"]')
      if (lock) document.head.removeChild(lock)
    }
  }

  // Called after a remote pull. Remote fills gaps, local values take precedence
  function hydrate(remote: UserSettings) {
    const merged = { ...remote, ...settings.value }
    settings.value = merged
    localStorage.setItem(STORAGE_KEY, JSON.stringify(merged))
  }

  return { settings, update, hydrate }
})
