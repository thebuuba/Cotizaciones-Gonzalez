import type { BusinessProfile } from '../domain/types'

export function createDefaultBusinessProfile(id: string = crypto.randomUUID(), updatedAt: string = new Date().toISOString()): BusinessProfile {
  return {
    id,
    businessName: 'Acabados Modernos Gonzalez',
    tagline: 'Transformamos tus espacios con estilo y calidad',
    headerPhone: '849-379-7731',
    terms: [
      'Se requiere del 50% al inicial del proyecto deseado.',
      'Esta cotización tiene validez de 15 días.',
      'No incluye materiales no especificados ni cambios fuera de esta.',
    ],
    bankAccounts: [
      { id: 'bank-banreservas', bank: 'Banreservas', type: 'Ahorro', number: '9604220069' },
      { id: 'bank-scotiabank', bank: 'Scotiabank', type: 'Corriente', number: '57000502207' },
      { id: 'bank-santacruz', bank: 'Banco Santa Cruz', type: 'Ahorro', number: '11102010025465' },
    ],
    managerName: 'Jefferson Gonzalez Del Rosario',
    managerTitle: 'GERENTE GENERAL',
    directPhone: '809-914-8622',
    whatsappPhone: '849-379-7731',
    footerQuality: 'CALIDAD QUE SE VE, DURABILIDAD QUE SE SIENTE.',
    footerCommitment: 'COMPROMETIDOS CON LA EXCELENCIA',
    footerFaith: 'Dios es bueno todo el tiempo',
    updatedAt,
  }
}

export function normalizeBusinessProfile(value: Record<string, unknown>): BusinessProfile {
  const id = typeof value.id === 'string' ? value.id : crypto.randomUUID()
  const updatedAt = typeof value.updatedAt === 'string' ? value.updatedAt : new Date().toISOString()
  const defaults = createDefaultBusinessProfile(id, updatedAt)
  return {
    ...defaults,
    ...value,
    id,
    updatedAt,
    headerPhone: typeof value.headerPhone === 'string'
      ? value.headerPhone
      : typeof value.phone === 'string' ? value.phone : defaults.headerPhone,
    managerName: typeof value.managerName === 'string'
      ? value.managerName
      : typeof value.ownerName === 'string' ? value.ownerName : defaults.managerName,
    terms: Array.isArray(value.terms) ? value.terms.filter((item): item is string => typeof item === 'string') : defaults.terms,
    bankAccounts: Array.isArray(value.bankAccounts) ? value.bankAccounts as BusinessProfile['bankAccounts'] : defaults.bankAccounts,
  }
}
