export type QuotationStatus = 'draft' | 'sent' | 'approved' | 'rejected'
export type SyncState = 'synced' | 'pending' | 'offline' | 'error'

export interface BankAccount {
  id: string
  bank: string
  type: string
  number: string
}

export interface BusinessProfile {
  id: string
  businessName: string
  tagline: string
  headerPhone: string
  terms: string[]
  bankAccounts: BankAccount[]
  managerName: string
  managerTitle: string
  directPhone: string
  whatsappPhone: string
  footerQuality: string
  footerCommitment: string
  footerFaith: string
  logoBlob?: Blob
  stampBlob?: Blob
  updatedAt: string
  deletedAt?: string
}

export interface Client {
  id: string
  name: string
  phone: string
  email: string
  address: string
  updatedAt: string
  deletedAt?: string
}

export interface ProjectLocation {
  id: string
  clientId: string
  label: string
  address: string
  updatedAt: string
  deletedAt?: string
}

export interface Quotation {
  id: string
  number: string
  clientId: string
  clientName: string
  clientAddress: string
  issueDate: string
  status: QuotationStatus
  laborMinor: number
  observations: string
  templateVersion: 1
  createdAt: string
  updatedAt: string
  deletedAt?: string
}

export interface MaterialItem {
  id: string
  quotationId: string
  description: string
  quantityMilli: number
  unit: string
  unitPriceMinor: number
  position: number
}

export interface QuotationTotals {
  materialsMinor: number
  laborMinor: number
  totalMinor: number
}

export interface QuotationSnapshot {
  business: BusinessProfile
  client: Client
  quotation: Quotation
  materialItems: MaterialItem[]
}
