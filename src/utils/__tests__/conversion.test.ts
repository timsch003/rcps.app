import { describe, expect, it } from 'vitest'
import { fractionToFloat } from '@/utils/conversion'

describe('fractionToFloat', () => {
  it('parses mixed numbers with slash fractions', () => {
    expect(fractionToFloat('1 1/2')).toBe(1.5)
  })

  it('parses standalone slash fractions', () => {
    expect(fractionToFloat('3/4')).toBe(0.75)
  })

  it('still parses mixed numbers with unicode fractions', () => {
    expect(fractionToFloat('2 ½')).toBe(2.5)
  })
})
