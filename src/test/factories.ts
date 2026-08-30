import type { QuotationSnapshot } from '../domain/types'

export function quotationSnapshotFactory(): QuotationSnapshot {
  return {
    business: {
      id: 'business-1',
      businessName: 'Acabados Modernos Gonzalez',
      tagline: 'Transformamos tus espacios con estilo y calidad',
      headerPhone: '849-379-7731',
      terms: [
        'Se requiere del 50% al inicial del proyecto deseado.',
        'Esta cotización tiene validez de 15 días.',
        'No incluye materiales no especificados ni cambios fuera de esta.',
      ],
      bankAccounts: [{ id: 'bank-1', bank: 'Banreservas', type: 'Ahorro', number: '9604220069' }],
      managerName: 'Jefferson Gonzalez Del Rosario',
      managerTitle: 'GERENTE GENERAL',
      directPhone: '809-914-8622',
      whatsappPhone: '849-379-7731',
      footerQuality: 'CALIDAD QUE SE VE, DURABILIDAD QUE SE SIENTE.',
      footerCommitment: 'COMPROMETIDOS CON LA EXCELENCIA',
      footerFaith: 'Dios es bueno todo el tiempo',
      updatedAt: '2026-08-29T12:00:00.000Z',
    },
    client: {
      id: 'client-1', name: 'María Rodríguez', phone: '809-555-0102',
      email: 'maria@example.com', address: 'Santo Domingo Este',
      updatedAt: '2026-08-29T12:00:00.000Z',
    },
    quotation: {
      id: 'quote-1', number: 'COT-0001', clientId: 'client-1',
      clientName: 'María Rodríguez', clientAddress: 'Santo Domingo Este',
      issueDate: '2026-08-29', status: 'approved', laborMinor: 8_000_00,
      observations: 'Confirmar color de la boquilla.', templateVersion: 1,
      createdAt: '2026-08-29T12:00:00.000Z', updatedAt: '2026-08-29T12:00:00.000Z',
    },
    materialItems: [
      { id: 'item-1', quotationId: 'quote-1', description: 'Cerámica', quantityMilli: 10_000, unit: 'm²', unitPriceMinor: 1_000_00, position: 0 },
      { id: 'item-2', quotationId: 'quote-1', description: 'Pegamento', quantityMilli: 5_000, unit: 'funda', unitPriceMinor: 500_00, position: 1 },
    ],
  }
}
