export type ThemeMode = 'light' | 'dark'

export type ThemeAccents = {
  dark: string[]
  light: string[]
}

export const THEME_ACCENTS: ThemeAccents = {
  dark: [
    '--d-candy',
    '--d-grapefruit',
    '--d-rose',
    '--d-bronze',
    '--d-canary',
    '--d-gold',
    '--d-lime',
    '--d-moss',
    '--d-sky',
    '--d-cornflower',
    '--d-turquoise',
    '--d-mauve',
    '--d-periwinkle',
  ],
  light: ['--l-crimson', '--l-brandy', '--l-olive', '--l-grape', '--l-indigo', '--l-velvet'],
}

export const DEFAULT_ACCENT_BY_THEME: Record<ThemeMode, string> = {
  dark: '--d-candy',
  light: '--l-crimson',
}

export function resolveTheme(theme?: string): ThemeMode {
  return theme === 'light' ? 'light' : 'dark'
}

export function getAvailableAccents(theme: ThemeMode, accents: ThemeAccents): string[] {
  return theme === 'dark' ? accents.dark : accents.light
}

export function resolveSelectedAccent(
  theme: ThemeMode,
  accent: string | undefined,
  availableAccents: string[],
): string {
  if (accent && availableAccents.includes(accent)) return accent

  const fallbackAccent = DEFAULT_ACCENT_BY_THEME[theme]
  if (availableAccents.includes(fallbackAccent)) return fallbackAccent

  return availableAccents[0] ?? fallbackAccent
}

export function resolveNextThemeSelection(
  currentTheme: ThemeMode,
  currentAccent: string | undefined,
  accents: ThemeAccents,
): { theme: ThemeMode; accent: string } {
  const nextTheme: ThemeMode = currentTheme === 'light' ? 'dark' : 'light'
  const nextThemeAccents = getAvailableAccents(nextTheme, accents)

  return {
    theme: nextTheme,
    accent: resolveSelectedAccent(nextTheme, currentAccent, nextThemeAccents),
  }
}

export function resolveAccent(theme: ThemeMode, accent?: string): string {
  const expectedPrefix = theme === 'dark' ? '--d-' : '--l-'

  if (!accent || !accent.startsWith(expectedPrefix)) return DEFAULT_ACCENT_BY_THEME[theme]
  return accent
}
