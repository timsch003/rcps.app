import { fractionsMap } from '@/utils/fixed_values'

export function fractionToFloat(quantityStr: string): number {
  if (quantityStr.trim() === '') return 0

  let total = 0

  const parseSlashFraction = (value: string): number | null => {
    const match = value.match(/^(-?\d+)\/(\d+)$/)
    if (!match) return null

    const numerator = parseInt(match[1]!, 10)
    const denominator = parseInt(match[2]!, 10)
    if (denominator === 0) return null

    return numerator / denominator
  }

  // Split by spaces to handle mixed numbers like "1 ½" or fractions like "½"
  const parts = quantityStr.trim().split(/\s+/)

  for (const part of parts) {
    if (fractionsMap[part]) {
      total += fractionsMap[part]
    } else {
      const slashFraction = parseSlashFraction(part)
      if (slashFraction !== null) {
        total += slashFraction
        continue
      }

      const num = parseFloat(part)
      if (!isNaN(num)) {
        total += num
      }
    }
  }

  return total > 0 ? total : 0
}

export function floatToFraction(value: number): string {
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

export function parseCssDurationToMs(durationValue: string, fallback = 0): number {
  const firstDuration = durationValue.split(',')[0]?.trim() || ''
  const parsed = Number.parseFloat(firstDuration)

  if (Number.isNaN(parsed)) return fallback
  if (firstDuration.endsWith('ms')) return parsed
  if (firstDuration.endsWith('s')) return parsed * 1000

  return parsed
}

export function getCssCustomPropertyDurationMs(
  propertyName: string,
  fallback = 0,
  rootElement: HTMLElement = document.documentElement,
): number {
  if (typeof window === 'undefined') return fallback

  const raw = getComputedStyle(rootElement).getPropertyValue(propertyName).trim()
  return parseCssDurationToMs(raw, fallback)
}
