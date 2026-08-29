import type { QuotationSnapshot } from '../domain/types'

export function quotationSnapshotFactory(): QuotationSnapshot {
  return {
    business: { id: 'business-1', businessName: 'Construcciones Pérez', ownerName: 'Carlos Pérez', phone: '809-555-0101', email: 'carlos@example.com', address: 'Santo Domingo', updatedAt: '2026-08-29T12:00:00.000Z' },
    client: { id: 'client-1', name: 'María Rodríguez', phone: '809-555-0102', email: 'maria@example.com', address: 'Santo Domingo', updatedAt: '2026-08-29T12:00:00.000Z' },
    projectLocation: { id: 'location-1', clientId: 'client-1', label: 'Casa', address: 'Santo Domingo Este', updatedAt: '2026-08-29T12:00:00.000Z' },
    quotation: { id: 'quote-1', number: 'COT-0001', clientId: 'client-1', projectLocationId: 'location-1', projectName: 'Remodelación Cocina', issueDate: '2026-08-29', validUntil: '2026-09-12', currency: 'DOP', status: 'approved', discount: { type: 'percentage', value: 1000 }, conditions: 'Materiales incluidos', duration: '4 semanas', notes: '', createdAt: '2026-08-29T12:00:00.000Z', updatedAt: '2026-08-29T12:00:00.000Z' },
    workItems: [
      { id: 'item-1', quotationId: 'quote-1', description: 'Demolición y preparación', priceMinor: 50_000_00, position: 0 },
      { id: 'item-2', quotationId: 'quote-1', description: 'Instalación de gabinetes', priceMinor: 100_000_00, position: 1 },
    ],
    images: [],
  }
}
