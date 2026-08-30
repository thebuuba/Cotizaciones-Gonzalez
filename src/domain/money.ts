import type { QuotationTotals } from './types'

interface MaterialPrice {
  quantityMilli: number
  unitPriceMinor: number
}

function assertSafeNonNegativeInteger(value: number, label: string): void {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new RangeError(`${label} debe usar un entero seguro no negativo.`)
  }
}

export function parseQuantityToMilli(value: string): number {
  const normalized = value.trim().replace(',', '.')
  if (!/^\d+(?:\.\d{1,3})?$/.test(normalized)) {
    throw new RangeError('La cantidad debe ser un número positivo con hasta tres decimales.')
  }

  const [whole, decimals = ''] = normalized.split('.')
  const result = Number(whole) * 1000 + Number(decimals.padEnd(3, '0'))
  if (!Number.isSafeInteger(result) || result <= 0) {
    throw new RangeError('La cantidad debe ser mayor que cero.')
  }
  return result
}

export function calculateMaterialTotal(item: MaterialPrice): number {
  assertSafeNonNegativeInteger(item.quantityMilli, 'La cantidad')
  assertSafeNonNegativeInteger(item.unitPriceMinor, 'El precio unitario')
  const product = item.quantityMilli * item.unitPriceMinor
  if (!Number.isSafeInteger(product)) throw new RangeError('El total del material excede el rango permitido.')
  return Math.round(product / 1000)
}

export function calculateQuotationTotals(items: MaterialPrice[], laborMinor: number): QuotationTotals {
  assertSafeNonNegativeInteger(laborMinor, 'La mano de obra')
  const materialsMinor = items.reduce((sum, item) => {
    const next = sum + calculateMaterialTotal(item)
    if (!Number.isSafeInteger(next)) throw new RangeError('El total de materiales excede el rango permitido.')
    return next
  }, 0)
  const totalMinor = materialsMinor + laborMinor
  if (!Number.isSafeInteger(totalMinor)) throw new RangeError('El total general excede el rango permitido.')
  return { materialsMinor, laborMinor, totalMinor }
}

export function formatMoney(amountMinor: number, locale = 'es-DO'): string {
  assertSafeNonNegativeInteger(amountMinor, 'El monto')
  const number = new Intl.NumberFormat(locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amountMinor / 100)
  return `RD$ ${number}`
}
