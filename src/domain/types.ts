export type Currency = 'DOP' | 'USD'
export type QuotationStatus = 'draft' | 'sent' | 'approved' | 'rejected'
export type SyncState = 'synced' | 'pending' | 'offline' | 'error'

export type Discount =
  | { type: 'none'; value: 0 }
  | { type: 'percentage'; value: number }
  | { type: 'fixed'; value: number }

export interface Money { currency: Currency; amountMinor: number }
export interface Totals { subtotalMinor: number; discountMinor: number; totalMinor: number }

export interface BusinessProfile {
  id: string; businessName: string; ownerName: string; phone: string; email: string; address: string
  logoBlob?: Blob; signatureBlob?: Blob; updatedAt: string; deletedAt?: string
}
export interface Client {
  id: string; name: string; phone: string; email: string; address: string; updatedAt: string; deletedAt?: string
}
export interface ProjectLocation {
  id: string; clientId: string; label: string; address: string; updatedAt: string; deletedAt?: string
}
export interface Quotation {
  id: string; number: string; clientId: string; projectLocationId: string; projectName: string
  issueDate: string; validUntil: string; currency: Currency; status: QuotationStatus; discount: Discount
  conditions: string; duration: string; notes: string; createdAt: string; updatedAt: string; deletedAt?: string
}
export interface WorkItem {
  id: string; quotationId: string; description: string; priceMinor: number; position: number
}
export interface QuotationImage {
  id: string; quotationId: string; blob?: Blob; remotePath?: string; caption?: string; position: number
}
export interface QuotationSnapshot {
  business: BusinessProfile
  client: Client
  projectLocation: ProjectLocation
  quotation: Quotation
  workItems: WorkItem[]
  images: QuotationImage[]
}
