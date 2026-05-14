import type { ThemeMode, UserSettings } from '@/types'

// Caching
export const MAX_TOTAL_CACHE_SIZE = 1000
export const MAX_LAST_VIEWED_CACHE_SIZE = 100

// Local storage
export const SETTINGS_STORAGE_KEY = 'rcps-app-settings'
export const PB_AUTH_STORAGE_KEY = 'rcps-app-auth'

// Theme
export const DEFAULT_THEME: ThemeMode = 'dark'
export const DEFAULT_ACCENT_BY_THEME: Record<ThemeMode, string> = {
  dark: '--d-grapefruit',
  light: '--l-cherry',
}
export const NO_ACCENT_TOKEN = '--text'
export const DEFAULT_USER_SETTINGS: Omit<UserSettings, 'theme' | 'accentDark' | 'accentLight'> = {
  keepScreenOn: true,
  lastViewed: [],
}
