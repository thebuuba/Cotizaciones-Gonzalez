import type { Discount, Money, Totals } from './types'

export function calculateTotals(_pricesMinor: number[], _discount: Discount): Totals {
  if (_pricesMinor.some((price) => !Number.isSafeInteger(price) || price < 0)) {
    throw new RangeError('Work prices cannot be negative and must use integer minor units.')
  }

  const subtotalMinor = _pricesMinor.reduce((sum, price) => sum + price, 0)
  if (!Number.isSafeInteger(subtotalMinor)) throw new RangeError('Quotation subtotal exceeds safe integer range.')

  let requestedDiscount = 0
  if (_discount.type === 'fixed') requestedDiscount = _discount.value
  if (_discount.type === 'percentage') {
    requestedDiscount = Math.round((subtotalMinor * _discount.value) / 10_000)
  }

  if (!Number.isSafeInteger(requestedDiscount) || requestedDiscount < 0) {
    throw new RangeError('Discount cannot be negative and must use integer units.')
  }

  const discountMinor = Math.min(subtotalMinor, requestedDiscount)
  return { subtotalMinor, discountMinor, totalMinor: subtotalMinor - discountMinor }
}

export function formatMoney(_money: Money, _locale = 'es-DO'): string {
  if (!Number.isSafeInteger(_money.amountMinor)) {
    throw new RangeError('Money must use integer minor units.')
  }

  return new Intl.NumberFormat(_locale, {
    style: 'currency',
    currency: _money.currency,
    currencyDisplay: 'symbol',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(_money.amountMinor / 100)
}
