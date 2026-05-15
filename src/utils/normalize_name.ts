export function normalizeName(name: string): string {
  return name.replace(/\s+/g, ' ').trim()
}
