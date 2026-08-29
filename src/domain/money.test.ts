import { describe, expect, it } from 'vitest'

import { calculateTotals, formatMoney } from './money'
import type { Discount } from './types'

describe('calculateTotals', () => {
  it.each([
    { name: 'empty quotation', prices: [], discount: { type: 'none', value: 0 } satisfies Discount, expected: { subtotalMinor: 0, discountMinor: 0, totalMinor: 0 } },
    { name: 'two fixed-price jobs', prices: [125_000, 75_000], discount: { type: 'none', value: 0 } satisfies Discount, expected: { subtotalMinor: 200_000, discountMinor: 0, totalMinor: 200_000 } },
    { name: 'percentage rounded to nearest cent', prices: [10_005], discount: { type: 'percentage', value: 3333 } satisfies Discount, expected: { subtotalMinor: 10_005, discountMinor: 3_335, totalMinor: 6_670 } },
    { name: 'fixed discount', prices: [50_000, 25_000], discount: { type: 'fixed', value: 12_500 } satisfies Discount, expected: { subtotalMinor: 75_000, discountMinor: 12_500, totalMinor: 62_500 } },
    { name: 'discount capped at subtotal', prices: [5_000], discount: { type: 'fixed', value: 8_000 } satisfies Discount, expected: { subtotalMinor: 5_000, discountMinor: 5_000, totalMinor: 0 } },
  ])('calculates $name using integer minor units', ({ prices, discount, expected }) => {
    expect(calculateTotals(prices, discount)).toEqual(expected)
  })

  it('rejects negative work prices before they corrupt a total', () => {
    expect(() => calculateTotals([25_000, -1], { type: 'none', value: 0 })).toThrow('negative')
  })
})

describe('formatMoney', () => {
  it.each([
    { currency: 'DOP' as const, amountMinor: 19_925_000, symbol: 'RD$', number: '199,250.00' },
    { currency: 'USD' as const, amountMinor: 123_456, symbol: 'US$', number: '1,234.56' },
  ])('formats $currency with its visible currency mark', ({ currency, amountMinor, symbol, number }) => {
    const result = formatMoney({ currency, amountMinor })
    expect(result).toContain(symbol)
    expect(result).toContain(number)
  })
})
