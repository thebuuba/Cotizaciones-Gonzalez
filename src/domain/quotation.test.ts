import { describe, expect, it } from 'vitest'

import { quotationSnapshotFactory } from '../test/factories'
import { duplicateQuotation, validateQuotationForExport } from './quotation'

describe('validateQuotationForExport', () => {
  it('accepts a complete quotation with at least one priced job', () => {
    expect(validateQuotationForExport(quotationSnapshotFactory())).toEqual([])
  })

  it('reports the user-fixable fields that prevent PDF export', () => {
    const snapshot = quotationSnapshotFactory()
    snapshot.business.businessName = ''
    snapshot.client.name = ''
    snapshot.quotation.projectName = ''
    snapshot.workItems = []

    expect(validateQuotationForExport(snapshot)).toEqual([
      'Configura el nombre del negocio.',
      'Selecciona un cliente.',
      'Escribe el nombre del proyecto.',
      'Agrega al menos un trabajo con precio.',
    ])
  })
})

describe('duplicateQuotation', () => {
  it('creates an independent draft while retaining quotation content', () => {
    const source = quotationSnapshotFactory()
    const copy = duplicateQuotation(source, new Date('2026-08-30T14:00:00.000Z'))

    expect(copy.quotation.id).not.toBe(source.quotation.id)
    expect(copy.quotation.status).toBe('draft')
    expect(copy.quotation.number).toBe('')
    expect(copy.quotation.createdAt).toBe('2026-08-30T14:00:00.000Z')
    expect(copy.client).toEqual(source.client)
    expect(copy.projectLocation).toEqual(source.projectLocation)
    expect(copy.workItems.map((item) => item.description)).toEqual(['Demolición y preparación', 'Instalación de gabinetes'])
    expect(copy.workItems.every((item) => item.quotationId === copy.quotation.id)).toBe(true)
    expect(copy.workItems[0]?.id).not.toBe(source.workItems[0]?.id)
  })
})
