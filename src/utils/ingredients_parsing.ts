import type { ParsedRecipeIngredient } from '@/types'

// Matches integers, decimals, common fractions, fraction characters and mixed numbers
// (e.g., "1 ½", "1½", "1.5", "1,5", "1/2", "1 1/2", but also "0.0")
export const regexFloatFraction =
  /(?:[1-9]+\s)?\d+\/\d+|\d+[,.]{1}\d+|(?:[1-9]+)?\s?[½⅓⅔¼¾⅕⅖⅗⅘⅙⅚⅐⅛⅜⅝⅞⅑⅒]{1}|[1-9]\s?[-–—−]\s?[1-9]|\d+/

export const fractionsMap: Record<string, number> = {
  '½': 0.5,
  '⅓': 1 / 3,
  '⅔': 2 / 3,
  '¼': 0.25,
  '¾': 0.75,
  '⅕': 0.2,
  '⅖': 0.4,
  '⅗': 0.6,
  '⅘': 0.8,
  '⅙': 1 / 6,
  '⅚': 5 / 6,
  '⅐': 1 / 7,
  '⅛': 0.125,
  '⅜': 0.375,
  '⅝': 0.625,
  '⅞': 0.875,
  '⅑': 1 / 9,
  '⅒': 0.1,
}

export function convertFractionToFloat(quantityStr: string): number | undefined {
  let total = 0

  // Split by spaces to handle mixed numbers like "1 ½" or fractions like "½"
  const parts = quantityStr.trim().split(/\s+/)

  for (const part of parts) {
    if (fractionsMap[part]) {
      total += fractionsMap[part]
    } else {
      const num = parseFloat(part)
      if (!isNaN(num)) {
        total += num
      }
    }
  }

  return total > 0 ? total : undefined
}

export function parseIngredientLine(line: string): ParsedRecipeIngredient | null {
  const trimmed = line.trim()

  if (!trimmed) return null

  // Match: [optional quantity of fractions/numbers] [optional unit] [name] [optional (notes)]
  const regex = /^(?:([\d\s½⅓⅔¼¾⅕⅖⅗⅘⅙⅚⅐⅛⅜⅝⅞⅑⅒]+)\s+)?(?:(\w+)\s+)?(.+?)(?:\s+\((.+)\))?$/
  const match = trimmed.match(regex)

  if (!match) return null

  const [quantityStr, unit, name, notes] = match

  return {
    quantity: convertFractionToFloat(quantityStr),
    unit: unit || undefined,
    name: name?.trim() || '',
    notes: notes || undefined,
  }
}

export function parseIngredients(text: string): ParsedRecipeIngredient[] {
  return text
    .split('\n')
    .map(parseIngredientLine)
    .filter((ing): ing is ParsedRecipeIngredient => ing !== null)
}
