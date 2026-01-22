import { units, fractionsMap } from '@/utils/parsing.values'
import type { MatchedIngredient } from '@/types'

const unitSet = new Set(units.map((u) => u.toLowerCase()))

// Matches integers, decimals, common fractions, fraction characters and mixed numbers
// (e.g., "1 ½", "1½", "1.5", "1,5", "1/2", "1 1/2", but also "0.0")
// plus everything that follows until the next quantity
export const regex =
  /((?:[1-9]+\s)?\d+\/\d+|\d+[,.]{1}\d+|(?:[1-9]+)?\s?[½⅓⅔¼¾⅕⅖⅗⅘⅙⅚⅐⅛⅜⅝⅞⅑⅒]{1}|\d+)(\s?[^0-9½⅓⅔¼¾⅕⅖⅗⅘⅙⅚⅐⅛⅜⅝⅞⅑⅒]+)?/gu

export function convertFractionToFloat(quantityStr: string): number {
  if (quantityStr.trim() === '') return 0

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

  return total > 0 ? total : 0
}

export function convertFloatToFraction(value: number): string {
  if (value <= 0) return ''

  const integerPart = Math.floor(value)
  const decimalPart = value - integerPart

  if (decimalPart === 0) {
    return integerPart.toString()
  }

  for (const [fractionChar, fractionValue] of Object.entries(fractionsMap).sort(
    (a, b) => b[1] - a[1],
  )) {
    if (Math.abs(decimalPart - fractionValue) < 0.0001) {
      // For mixed numbers (integer + fraction)
      if (integerPart > 0) {
        return `${integerPart} ${fractionChar}`
      }
      return fractionChar
    }
  }

  return value.toString()
}

export function limitDecimals(value: number): number {
  const numString = value.toString()
  if (numString.includes('.')) {
    const [, decimalPart] = numString.split('.')
    if (decimalPart!.length > 2) {
      return parseFloat(value.toFixed(2))
    }
  }
  return value
}

export function matchIngredients(ingredients: string): MatchedIngredient[] | [] {
  if (!ingredients.trim()) return []

  const ingredientLines = ingredients.split('\n').filter((line) => line.trim() !== '')

  return ingredientLines.map((line) => {
    const trimmedLine = line.replace(/\s+/g, ' ').trim()

    const parts = []
    let match

    while ((match = regex.exec(trimmedLine)) !== null) {
      const quantity = match[1] && match[1]
      const potentialUnit = match[2] && match[2]
      const knownUnit = potentialUnit?.split(' ').find((part) => unitSet.has(part.toLowerCase()))
      const textAfterQuantity = knownUnit ? potentialUnit?.replace(knownUnit, '') : potentialUnit

      parts.push({
        quantity: (quantity && convertFractionToFloat(quantity)) || undefined,
        knownUnit: knownUnit || undefined,
        textAfterQuantity: textAfterQuantity || undefined,
        deselected: false,
      })
    }

    if (!parts.length) return trimmedLine
    else return parts
  })
}
