import { describe, expect, it } from 'vitest'

import {
  calculateMaterialTotal,
  calculateQuotationTotals,
  formatMoney,
  parseQuantityToMilli,
} from './money'

describe('parseQuantityToMilli', () => {
  it.each([
    ['1', 1_000],
    ['1.5', 1_500],
    ['1,5', 1_500],
    ['0.125', 125],
  ])('parses %s without binary floating point', (value, expected) => {
    expect(parseQuantityToMilli(value)).toBe(expected)
  })

  it.each(['', '-1', '1.2345', 'texto'])('rejects invalid quantity %s', (value) => {
    expect(() => parseQuantityToMilli(value)).toThrow('cantidad')
  })
})

describe('material and quotation totals', () => {
  it('rounds a decimal material quantity to the nearest cent', () => {
    expect(calculateMaterialTotal({ quantityMilli: 1_500, unitPriceMinor: 100_00 })).toBe(150_00)
  })

  it('adds material rows and one labor amount', () => {
    expect(calculateQuotationTotals([
      { quantityMilli: 10_000, unitPriceMinor: 1_000_00 },
      { quantityMilli: 5_000, unitPriceMinor: 500_00 },
    ], 8_000_00)).toEqual({
      materialsMinor: 12_500_00,
      laborMinor: 8_000_00,
      totalMinor: 20_500_00,
    })
  })

  it('rejects negative or unsafe integer values', () => {
    expect(() => calculateMaterialTotal({ quantityMilli: -1, unitPriceMinor: 100 })).toThrow('cantidad')
    expect(() => calculateQuotationTotals([], -1)).toThrow('mano de obra')
  })
})

describe('formatMoney', () => {
  it('always formats Dominican pesos with the visible RD$ prefix', () => {
    expect(formatMoney(19_925_000)).toMatch(/RD[$]\s?199,250\.00/)
  })
})
