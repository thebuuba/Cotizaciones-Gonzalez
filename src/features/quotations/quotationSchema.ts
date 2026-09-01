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

export function parseMoneyInput(value: string): number {
  const normalized = value.trim().replace(',', '.')
  if (!/^\d+(?:\.\d{1,2})?$/.test(normalized)) throw new RangeError('El monto debe tener hasta dos decimales.')
  const [whole, decimals = ''] = normalized.split('.')
  const result = Number(whole) * 100 + Number(decimals.padEnd(2, '0'))
  if (!Number.isSafeInteger(result) || result < 0) throw new RangeError('El monto no es válido.')
  return result
}
