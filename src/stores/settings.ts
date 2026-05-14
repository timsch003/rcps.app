import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { resolveAccent, resolveTheme } from '@/utils/theme_settings'
import {
  DEFAULT_ACCENT_BY_THEME,
  DEFAULT_THEME,
  DEFAULT_USER_SETTINGS,
  SETTINGS_STORAGE_KEY,
} from '../constants'
import type { UserSettings } from '@/types'

type StoredUserSettings = Partial<UserSettings>

export const useSettingsStore = defineStore('settings', () => {
  const storedSettings = ref<StoredUserSettings>(readFromStorage())
  const settings = computed<UserSettings>(() => withDefaults(storedSettings.value))
  const hasLocalChanges = ref(false)

  applyVisualSettings(settings.value)

  function readFromStorage(): StoredUserSettings {
    try {
      const raw = localStorage.getItem(SETTINGS_STORAGE_KEY)
      return raw ? stripDefaults(JSON.parse(raw) as Partial<UserSettings>) : {}
    } catch {
      return {}
    }
  }

  function withDefaults(nextSettings: StoredUserSettings): UserSettings {
    return {
      theme: nextSettings.theme ?? DEFAULT_THEME,
      accentDark: nextSettings.accentDark ?? DEFAULT_ACCENT_BY_THEME.dark,
      accentLight: nextSettings.accentLight ?? DEFAULT_ACCENT_BY_THEME.light,
      keepScreenOn: nextSettings.keepScreenOn ?? DEFAULT_USER_SETTINGS.keepScreenOn,
      lastViewed: nextSettings.lastViewed
        ? [...nextSettings.lastViewed]
        : [...DEFAULT_USER_SETTINGS.lastViewed],
    }
  }

  function stripDefaults(nextSettings: Partial<UserSettings>): StoredUserSettings {
    const persisted: StoredUserSettings = {}

    if (nextSettings.theme && nextSettings.theme !== DEFAULT_THEME)
      persisted.theme = nextSettings.theme
    if (nextSettings.accentDark && nextSettings.accentDark !== DEFAULT_ACCENT_BY_THEME.dark)
      persisted.accentDark = nextSettings.accentDark
    if (nextSettings.accentLight && nextSettings.accentLight !== DEFAULT_ACCENT_BY_THEME.light)
      persisted.accentLight = nextSettings.accentLight
    if (
      nextSettings.keepScreenOn !== undefined &&
      nextSettings.keepScreenOn !== DEFAULT_USER_SETTINGS.keepScreenOn
    )
      persisted.keepScreenOn = nextSettings.keepScreenOn
    if (nextSettings.lastViewed?.length) persisted.lastViewed = [...nextSettings.lastViewed]

    return persisted
  }

  function persistStoredSettings(nextSettings: UserSettings): void {
    storedSettings.value = stripDefaults(nextSettings)
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(storedSettings.value))
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
    const accentForTheme = theme === 'dark' ? nextSettings.accentDark : nextSettings.accentLight
    const accent = resolveAccent(theme, accentForTheme)

    document.documentElement.setAttribute('data-theme', theme)
    document.documentElement.style.setProperty('--accent', `var(${accent})`)
    applyDarkReaderLock(theme)
  }

  function isStoredSettingsEqual(left: StoredUserSettings, right: StoredUserSettings): boolean {
    const keys = new Set<keyof StoredUserSettings>([
      ...(Object.keys(left) as Array<keyof StoredUserSettings>),
      ...(Object.keys(right) as Array<keyof StoredUserSettings>),
    ])

    for (const key of keys) {
      if (!areStoredSettingValuesEqual(left[key], right[key])) return false
    }

    return true
  }

  function update(patch: Partial<UserSettings>) {
    const nextSettings = withDefaults({ ...storedSettings.value, ...patch })
    const nextStoredSettings = stripDefaults(nextSettings)
    if (isStoredSettingsEqual(nextStoredSettings, storedSettings.value)) return

    persistStoredSettings(nextSettings)
    hasLocalChanges.value = true
    applyVisualSettings(nextSettings)
  }

  // Called after a remote pull. Remote fills gaps, local values take precedence
  function hydrate(
    remote: Partial<UserSettings>,
  ): { before: StoredUserSettings; after: StoredUserSettings } | null {
    const storedBefore = { ...storedSettings.value }
    const merged = withDefaults({ ...remote, ...storedSettings.value })
    persistStoredSettings(merged)
    applyVisualSettings(merged)
    const storedAfter = { ...storedSettings.value }
    if (isStoredSettingsEqual(storedBefore, storedAfter)) return null
    return { before: storedBefore, after: storedAfter }
  }

  function getStoredSettings(): StoredUserSettings {
    return {
      ...storedSettings.value,
      ...(storedSettings.value.lastViewed
        ? { lastViewed: [...storedSettings.value.lastViewed] }
        : {}),
    }
  }

  function markSettingsSynced() {
    hasLocalChanges.value = false
  }

  function areStoredSettingValuesEqual(
    left: StoredUserSettings[keyof StoredUserSettings],
    right: StoredUserSettings[keyof StoredUserSettings],
  ): boolean {
    if (left === right) return true

    if (Array.isArray(left) || Array.isArray(right)) {
      if (!Array.isArray(left) || !Array.isArray(right)) return false
      if (left.length !== right.length) return false
      return left.every((item, index) => item === right[index])
    }

    return false
  }

  return { settings, hasLocalChanges, update, hydrate, markSettingsSynced, getStoredSettings }
})
