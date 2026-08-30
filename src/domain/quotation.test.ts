import { describe, expect, it } from 'vitest'

import { quotationSnapshotFactory } from '../test/factories'
import { duplicateQuotation, validateQuotationForExport } from './quotation'

describe('validateQuotationForExport', () => {
  it('accepts the fields present on the physical quotation sheet', () => {
    expect(validateQuotationForExport(quotationSnapshotFactory())).toEqual([])
  })

  it('reports every visible field that prevents export', () => {
    const snapshot = quotationSnapshotFactory()
    snapshot.business.businessName = ''
    snapshot.quotation.clientName = ''
    snapshot.quotation.clientAddress = ''
    snapshot.quotation.issueDate = ''
    snapshot.quotation.laborMinor = -1
    snapshot.materialItems = [{
      id: 'item-invalid', quotationId: snapshot.quotation.id, description: '',
      quantityMilli: 0, unit: '', unitPriceMinor: -1, position: 0,
    }]

    expect(validateQuotationForExport(snapshot)).toEqual([
      'Configura el nombre del negocio.',
      'Escribe el nombre del cliente.',
      'Escribe la dirección del cliente.',
      'Selecciona la fecha.',
      'Agrega al menos un material completo.',
      'La mano de obra no puede ser negativa.',
    ])
  })
})

describe('duplicateQuotation', () => {
  it('creates an independent draft while retaining sheet content', () => {
    const source = quotationSnapshotFactory()
    const copy = duplicateQuotation(source, new Date('2026-08-30T14:00:00.000Z'))

    expect(copy.quotation.id).not.toBe(source.quotation.id)
    expect(copy.quotation.status).toBe('draft')
    expect(copy.quotation.number).toBe('')
    expect(copy.quotation.createdAt).toBe('2026-08-30T14:00:00.000Z')
    expect(copy.client).toEqual(source.client)
    expect(copy.materialItems.map((item) => item.description)).toEqual(['Cerámica', 'Pegamento'])
    expect(copy.materialItems.every((item) => item.quotationId === copy.quotation.id)).toBe(true)
    expect(copy.materialItems[0]?.id).not.toBe(source.materialItems[0]?.id)
  })
})
