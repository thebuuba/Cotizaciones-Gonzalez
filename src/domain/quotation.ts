import type { QuotationSnapshot } from './types'

export function validateQuotationForExport(_snapshot: QuotationSnapshot): string[] {
  const errors: string[] = []
  if (!_snapshot.business.businessName.trim()) errors.push('Configura el nombre del negocio.')
  if (!_snapshot.client.name.trim()) errors.push('Selecciona un cliente.')
  if (!_snapshot.quotation.projectName.trim()) errors.push('Escribe el nombre del proyecto.')
  if (!_snapshot.workItems.some((item) => item.description.trim() && item.priceMinor > 0)) {
    errors.push('Agrega al menos un trabajo con precio.')
  }
  return errors
}

export function duplicateQuotation(source: QuotationSnapshot, _now: Date): QuotationSnapshot {
  const quotationId = crypto.randomUUID()
  const timestamp = _now.toISOString()

  return {
    business: { ...source.business },
    client: { ...source.client },
    projectLocation: { ...source.projectLocation },
    quotation: {
      ...source.quotation,
      id: quotationId,
      number: '',
      status: 'draft',
      createdAt: timestamp,
      updatedAt: timestamp,
      deletedAt: undefined,
    },
    workItems: source.workItems.map((item) => ({
      ...item,
      id: crypto.randomUUID(),
      quotationId,
    })),
    images: source.images.map((image) => ({
      ...image,
      id: crypto.randomUUID(),
      quotationId,
      remotePath: undefined,
    })),
  }
}
