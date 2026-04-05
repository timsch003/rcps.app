import { fractionsMap } from '@/utils/fixed_values'

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
