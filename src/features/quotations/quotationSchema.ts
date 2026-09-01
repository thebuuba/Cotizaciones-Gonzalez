import { z } from 'zod'

export const materialDraftSchema = z.object({
  id: z.string().min(1),
  description: z.string().trim().min(1),
  quantity: z.string().trim().min(1),
  unit: z.string().trim().min(1),
  unitPrice: z.string().trim().min(1),
})

export const quotationDraftSchema = z.object({
  clientId: z.string(),
  clientName: z.string().trim().min(1),
  clientPhone: z.string().trim(),
  clientAddress: z.string().trim().min(1),
  issueDate: z.string().min(1),
  labor: z.string(),
  observations: z.string(),
  materials: z.array(materialDraftSchema).min(1),
})

export type QuotationDraft = z.infer<typeof quotationDraftSchema>

const DR_PHONE_PREFIXES = ['809', '829', '849']

export function formatPhone(raw: string): string {
  const digits = raw.replace(/\D/g, '')
  if (digits.length === 0) return ''
  const isDR = DR_PHONE_PREFIXES.some((prefix) => digits.startsWith(prefix))
  if (isDR) {
    const d = digits.slice(0, 10)
    if (d.length <= 3) return d
    if (d.length <= 6) return `(${d.slice(0, 3)}) ${d.slice(3)}`
    return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`
  }
  const d = digits.startsWith('1') ? digits.slice(0, 11) : digits.slice(0, 10)
  if (d.length === 0) return ''
  const withPrefix = d.startsWith('1') ? d : `1${d}`
  if (withPrefix.length <= 1) return withPrefix
  if (withPrefix.length <= 4) return `+${withPrefix.slice(0, 1)} (${withPrefix.slice(1)}`
  if (withPrefix.length <= 7) return `+${withPrefix.slice(0, 1)} (${withPrefix.slice(1, 4)}) ${withPrefix.slice(4)}`
  return `+${withPrefix.slice(0, 1)} (${withPrefix.slice(1, 4)}) ${withPrefix.slice(4, 7)}-${withPrefix.slice(7)}`
}

export function parseMoneyInput(value: string): number {
  const normalized = value.trim().replace(',', '.')
  if (!/^\d+(?:\.\d{1,2})?$/.test(normalized)) throw new RangeError('El monto debe tener hasta dos decimales.')
  const [whole, decimals = ''] = normalized.split('.')
  const result = Number(whole) * 100 + Number(decimals.padEnd(2, '0'))
  if (!Number.isSafeInteger(result) || result < 0) throw new RangeError('El monto no es válido.')
  return result
}
