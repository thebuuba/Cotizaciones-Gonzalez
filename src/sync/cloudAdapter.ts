import type { OutboxOperation } from '../db/database'
import type { BusinessProfile, QuotationSnapshot } from '../domain/types'
import type { CloudBackup, CloudMaterialRecord, CloudRecord } from './syncEngine'

type BackupTable = 'business_profiles' | 'clients' | 'quotations' | 'material_items'
type BackupRow = Record<string, unknown> & { id: string; payload: unknown; updated_at: string; deleted_at?: string | null; version: number; quotation_id?: string; logo_path?: string | null; stamp_path?: string | null }

export interface BackupTransport {
  upsert(table: BackupTable, row: Record<string, unknown> | Array<Record<string, unknown>>): Promise<void>
  list(table: BackupTable): Promise<BackupRow[]>
  upload(path: string, body: Blob): Promise<void>
  download(path: string): Promise<Blob>
}

function versionOf(value: string): number {
  const version = Date.parse(value)
  return Number.isFinite(version) ? version : 0
}

function withoutBlobs(profile: BusinessProfile): Omit<BusinessProfile, 'logoBlob' | 'stampBlob'> {
  const payload = { ...profile }
  delete payload.logoBlob
  delete payload.stampBlob
  return payload
}

function extension(blob: Blob): string {
  return blob.type === 'image/jpeg' ? 'jpg' : blob.type === 'image/svg+xml' ? 'svg' : 'png'
}

function cloudRecord(row: BackupRow): CloudRecord {
  return {
    id: row.id,
    payload: row.payload,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at ?? undefined,
    version: row.version,
  }
}

export class SupabaseCloudAdapter {
  constructor(private readonly transport: BackupTransport, private readonly ownerId: string) {}

  async push(operation: OutboxOperation): Promise<void> {
    if (operation.entityType === 'businessProfile') return this.pushBusiness(operation)
    if (operation.entityType === 'client') return this.pushClient(operation)
    if (operation.entityType === 'quotation') return this.pushQuotation(operation)
    throw new Error(`Tipo de respaldo no soportado: ${operation.entityType}`)
  }

  private async pushBusiness(operation: OutboxOperation) {
    const profile = operation.payload as BusinessProfile | undefined
    if (!profile) {
      await this.transport.upsert('business_profiles', this.baseRow(operation, {}))
      return
    }
    const logoPath = profile.logoBlob ? `${this.ownerId}/${profile.id}/logo.${extension(profile.logoBlob)}` : undefined
    const stampPath = profile.stampBlob ? `${this.ownerId}/${profile.id}/stamp.${extension(profile.stampBlob)}` : undefined
    if (profile.logoBlob && logoPath) await this.transport.upload(logoPath, profile.logoBlob)
    if (profile.stampBlob && stampPath) await this.transport.upload(stampPath, profile.stampBlob)
    await this.transport.upsert('business_profiles', {
      ...this.baseRow(operation, withoutBlobs(profile)), logo_path: logoPath, stamp_path: stampPath,
    })
  }

  private async pushClient(operation: OutboxOperation) {
    await this.transport.upsert('clients', this.baseRow(operation, operation.payload ?? {}))
  }

  private async pushQuotation(operation: OutboxOperation) {
    if (operation.action === 'delete' || !operation.payload) {
      await this.transport.upsert('quotations', this.baseRow(operation, {}))
      return
    }
    const snapshot = operation.payload as QuotationSnapshot
    await this.transport.upsert('quotations', {
      ...this.baseRow(operation, {
        quotation: snapshot.quotation,
        materialIds: snapshot.materialItems.map((item) => item.id),
      }),
      client_id: snapshot.quotation.clientId,
    })
    await this.transport.upsert('material_items', snapshot.materialItems.map((item) => ({
      owner_id: this.ownerId,
      id: item.id,
      quotation_id: item.quotationId,
      payload: item,
      updated_at: snapshot.quotation.updatedAt,
      deleted_at: null,
      version: versionOf(snapshot.quotation.updatedAt),
    })))
  }

  private baseRow(operation: OutboxOperation, payload: unknown): Record<string, unknown> {
    return {
      owner_id: this.ownerId,
      id: operation.entityId,
      payload,
      updated_at: operation.createdAt,
      deleted_at: operation.action === 'delete' ? operation.createdAt : null,
      version: versionOf(operation.createdAt),
    }
  }

  async pull(): Promise<CloudBackup> {
    const [businessProfiles, clients, quotations, materials] = await Promise.all([
      this.transport.list('business_profiles'),
      this.transport.list('clients'),
      this.transport.list('quotations'),
      this.transport.list('material_items'),
    ])
    const restoredProfiles = await Promise.all(businessProfiles.map(async (row) => {
      const record = cloudRecord(row)
      if (record.deletedAt) return record
      const profile = { ...(record.payload as BusinessProfile) }
      if (row.logo_path) profile.logoBlob = await this.transport.download(row.logo_path)
      if (row.stamp_path) profile.stampBlob = await this.transport.download(row.stamp_path)
      return { ...record, payload: profile }
    }))
    return {
      businessProfiles: restoredProfiles,
      clients: clients.map(cloudRecord),
      quotations: quotations.map(cloudRecord),
      materialItems: materials.map((row): CloudMaterialRecord => ({ ...cloudRecord(row), quotationId: String(row.quotation_id ?? '') })),
    }
  }
}
