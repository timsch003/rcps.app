export type ThemeMode = 'light' | 'dark'

export const DEFAULT_ACCENT_BY_THEME: Record<ThemeMode, string> = {
  dark: '--d-algae',
  light: '--l-emerald',
}

export function resolveTheme(theme?: string): ThemeMode {
  return theme === 'light' ? 'light' : 'dark'
}

export function resolveAccent(theme: ThemeMode, accent?: string): string {
  const expectedPrefix = theme === 'dark' ? '--d-' : '--l-'

  if (!accent || !accent.startsWith(expectedPrefix)) return DEFAULT_ACCENT_BY_THEME[theme]
  return accent
}
