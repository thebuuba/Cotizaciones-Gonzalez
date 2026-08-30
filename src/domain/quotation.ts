import type { MaterialItem, QuotationSnapshot } from './types'

function isCompleteMaterial(item: MaterialItem): boolean {
  return Boolean(
    item.description.trim()
    && item.quantityMilli > 0
    && item.unit.trim()
    && Number.isSafeInteger(item.unitPriceMinor)
    && item.unitPriceMinor >= 0,
  )
}

export function validateQuotationForExport(snapshot: QuotationSnapshot): string[] {
  const errors: string[] = []
  if (!snapshot.business.businessName.trim()) errors.push('Configura el nombre del negocio.')
  if (!snapshot.quotation.clientName.trim()) errors.push('Escribe el nombre del cliente.')
  if (!snapshot.quotation.clientAddress.trim()) errors.push('Escribe la dirección del cliente.')
  if (!snapshot.quotation.issueDate.trim()) errors.push('Selecciona la fecha.')
  if (!snapshot.materialItems.some(isCompleteMaterial)) errors.push('Agrega al menos un material completo.')
  if (!Number.isSafeInteger(snapshot.quotation.laborMinor) || snapshot.quotation.laborMinor < 0) {
    errors.push('La mano de obra no puede ser negativa.')
  }
  return errors
}

export function duplicateQuotation(source: QuotationSnapshot, now: Date): QuotationSnapshot {
  const quotationId = crypto.randomUUID()
  const timestamp = now.toISOString()
  return {
    business: { ...source.business },
    client: { ...source.client },
    quotation: {
      ...source.quotation,
      id: quotationId,
      number: '',
      status: 'draft',
      createdAt: timestamp,
      updatedAt: timestamp,
      deletedAt: undefined,
    },
    materialItems: source.materialItems.map((item) => ({
      ...item,
      id: crypto.randomUUID(),
      quotationId,
    })),
  }
}
