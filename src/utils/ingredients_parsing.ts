import type { ParsedRecipeIngredient } from '@/types'

export const fractionMap: Record<string, number> = {
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

// Matches integers, decimals, common fractions, fraction characters and mixed numbers
// (e.g., "1 ½", "1½", "1.5", "1,5", "1/2", "1 1/2", but also "0.0")
export const regexFloatOrFractionAndUnit =
  /((?:[1-9]+\s)?\d+\/\d+|\d+[,.]{1}\d+|(?:[1-9]+)?\s?[½⅓⅔¼¾⅕⅖⅗⅘⅙⅚⅐⅛⅜⅝⅞⅑⅒]{1}|[1-9]\s?[-–—−~〜～]\s?[1-9]|\d+)\s?([\p{L}-]+)/gu

export function convertFractionToFloat(quantityStr: string): number | undefined {
  let total = 0

  // Split by spaces to handle mixed numbers like "1 ½" or fractions like "½"
  const parts = quantityStr.trim().split(/\s+/)

  for (const part of parts) {
    if (fractionMap[part]) {
      total += fractionMap[part]
    } else {
      const num = parseFloat(part)
      if (!isNaN(num)) {
        total += num
      }
    }
  }

  return total > 0 ? total : undefined
}

export function getQuantityUnitPairs(ingredients: string): {
  trimmedLine: string
  quantityUnitPairs?: { quantity: string; unit: string }[]
}[] {
  return ingredients.split('\n').map((line) => {
    const trimmedLine = line.replace(/\s+/g, ' ').trim()

    const matches = trimmedLine.matchAll(regexFloatOrFractionAndUnit)

    const ingredientParts: { quantity: string; unit: string }[] = []

    for (const match of matches) {
      if (!match[0]) continue

      ingredientParts.push({
        quantity: match[1] || '',
        unit: match[2] || '',
      })
    }

    return {
      trimmedLine,
      quantityUnitPairs: ingredientParts,
    }
  })
}

// export function parseIngredientLine(
//   line: string,
// ): (Omit<ParsedRecipeIngredient, 'quantity'> & { quantities: number[] }) | null {
//   const trimmed = line.trim()

//   if (!trimmed) return null

//   const quantities = trimmed.match(regexFloatOrFractionAndUnit)

//   return {
//     quantities: quantities
//       ? quantities.map(convertFractionToFloat).filter((q): q is number => q !== undefined)
//       : [],
//     unit: unit || undefined,
//     name: name?.trim() || '',
//     notes: notes || undefined,
//   }
// }

// export function parseIngredients(text: string): ParsedRecipeIngredient[] {
//   return text
//     .split('\n')
//     .map(parseIngredientLine)
//     .filter((ing): ing is ParsedRecipeIngredient => ing !== null)
// }
