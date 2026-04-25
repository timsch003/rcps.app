import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { UserSettings } from '@/types'
import { resolveAccent, resolveTheme } from '@/utils/theme_settings'

const STORAGE_KEY = 'rcps-app-settings'

export const useSettingsStore = defineStore('settings', () => {
  const settings = ref<UserSettings>(withDefaults(readFromStorage()))
  applyVisualSettings(settings.value)

  function readFromStorage(): UserSettings {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      return raw ? JSON.parse(raw) : {}
    } catch {
      return {}
    }
  }

  function withDefaults(nextSettings: UserSettings): UserSettings {
    return {
      ...nextSettings,
      keepScreenOn: nextSettings.keepScreenOn ?? true,
    }
  }

  function applyDarkReaderLock(theme: 'light' | 'dark') {
    const lock = document.head.querySelector('meta[name="darkreader-lock"]')

    if (theme === 'dark') {
      if (!lock) {
        const nextLock = document.createElement('meta')
        nextLock.name = 'darkreader-lock'
        document.head.appendChild(nextLock)
      }
      return
    }

    if (lock) document.head.removeChild(lock)
  }

  function applyVisualSettings(nextSettings: UserSettings) {
    if (typeof document === 'undefined') return

    const theme = resolveTheme(nextSettings.theme)
    const accent = resolveAccent(theme, nextSettings.accent)

    document.documentElement.setAttribute('data-theme', theme)
    document.documentElement.style.setProperty('--accent', `var(${accent})`)
    applyDarkReaderLock(theme)
  }

  function update(patch: Partial<UserSettings>) {
    settings.value = withDefaults({ ...settings.value, ...patch })
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings.value))
    applyVisualSettings(settings.value)
  }

  // Called after a remote pull. Remote fills gaps, local values take precedence
  function hydrate(remote: UserSettings) {
    const merged = withDefaults({ ...remote, ...settings.value })
    settings.value = merged
    localStorage.setItem(STORAGE_KEY, JSON.stringify(merged))
    applyVisualSettings(merged)
  }

  return { settings, update, hydrate }
})
