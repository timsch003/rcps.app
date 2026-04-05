import { unitsSet } from '@/utils/fixed_values'
import { convertFractionToFloat } from '@/utils/conversion'
import type { MatchedIngredient } from '@/types'

// Matches integers, decimals, common fractions, fraction characters and mixed numbers
// (e.g., "1 ½", "1½", "1.5", "1,5", "1/2", "1 1/2", but also "0.0", plus all of those as a range using various dashes)
// plus everything that follows until the next quantity
export const ingredientsRegex =
  /((?:[1-9]+\s)?\d+\/\d+|\d+[,.]{1}\d+|(?:[1-9]+)?\s?[½⅓⅔¼¾⅕⅖⅗⅘⅙⅚⅐⅛⅜⅝⅞⅑⅒]{1}|\d+)\s?[-–—−~〜～\u2010-\u2015]?\s?(?:(?:[1-9]+\s)?\d+\/\d+|\d+[,.]{1}\d+|(?:[1-9]+)?\s?[½⅓⅔¼¾⅕⅖⅗⅘⅙⅚⅐⅛⅜⅝⅞⅑⅒]{1}|\d+)?(\s?[^0-9½⅓⅔¼¾⅕⅖⅗⅘⅙⅚⅐⅛⅜⅝⅞⅑⅒]+)?/gu

export function matchIngredients(ingredients: string): MatchedIngredient[] | [] {
  if (!ingredients.trim()) return []

  const ingredientLines = ingredients.split('\n').filter((line) => line.trim() !== '')

  return ingredientLines.map((line) => {
    const trimmedLine = line.replace(/\s+/g, ' ').trim()

    const parts = []
    let match

    while ((match = ingredientsRegex.exec(trimmedLine)) !== null) {
      const quantity = match[1] && match[1]
      const potentialUnit = match[2] && match[2]
      const knownUnit = potentialUnit?.split(' ').find((part) => unitsSet.has(part.toLowerCase()))
      const textAfterQuantity = knownUnit ? potentialUnit?.replace(knownUnit, '') : potentialUnit

      parts.push({
        quantity: (quantity && convertFractionToFloat(quantity)) || undefined,
        knownUnit: knownUnit || undefined,
        textAfterQuantity: textAfterQuantity || undefined,
        selected: false,
      })
    }

    if (!parts[0]) return trimmedLine
    else {
      parts[0].selected = true
      return parts
    }
  })
}
