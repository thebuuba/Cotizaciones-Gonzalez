import { describe, expect, it, vi } from 'vitest'

import type { OutboxOperation } from '../db/database'
import { quotationSnapshotFactory } from '../test/factories'
import { SupabaseCloudAdapter, type BackupTransport } from './cloudAdapter'

function transport(): BackupTransport {
  return {
    upsert: vi.fn().mockResolvedValue(undefined),
    list: vi.fn().mockResolvedValue([]),
    listMaterialsForQuotation: vi.fn().mockResolvedValue([]),
    upload: vi.fn().mockResolvedValue(undefined),
    download: vi.fn().mockResolvedValue(new Blob(['asset'], { type: 'image/png' })),
  }
}

describe('SupabaseCloudAdapter', () => {
  it('uploads business images separately and never embeds Blob values in JSON', async () => {
    const api = transport()
    const snapshot = quotationSnapshotFactory()
    snapshot.business.logoBlob = new Blob(['logo'], { type: 'image/png' })
    snapshot.business.stampBlob = new Blob(['stamp'], { type: 'image/png' })
    const operation: OutboxOperation = {
      id: 'business:1', entityType: 'businessProfile', entityId: snapshot.business.id,
      action: 'upsert', payload: snapshot.business, createdAt: snapshot.business.updatedAt,
      nextAttemptAt: snapshot.business.updatedAt, attempt: 0,
    }

    await new SupabaseCloudAdapter(api, 'owner-1').push(operation)

    expect(api.upload).toHaveBeenCalledTimes(2)
    expect(api.upload).toHaveBeenCalledWith('owner-1/business-1/logo.png', snapshot.business.logoBlob)
    const row = vi.mocked(api.upsert).mock.calls[0]![1] as { payload: Record<string, unknown> }
    expect(row.payload).not.toHaveProperty('logoBlob')
    expect(row.payload).not.toHaveProperty('stampBlob')
  })

  it('backs up quotation materials without converting integer amounts or quantities', async () => {
    const api = transport()
    const snapshot = quotationSnapshotFactory()
    const operation: OutboxOperation = {
      id: 'quotation:1', entityType: 'quotation', entityId: snapshot.quotation.id,
      action: 'upsert', payload: snapshot, createdAt: snapshot.quotation.updatedAt,
      nextAttemptAt: snapshot.quotation.updatedAt, attempt: 0,
    }

    await new SupabaseCloudAdapter(api, 'owner-1').push(operation)

    expect(api.upsert).toHaveBeenCalledWith('quotations', expect.objectContaining({
      owner_id: 'owner-1', id: 'quote-1', client_id: 'client-1',
    }))
    expect(api.upsert).toHaveBeenCalledWith('material_items', expect.arrayContaining([
      expect.objectContaining({ id: 'item-1', quotation_id: 'quote-1', payload: expect.objectContaining({ quantityMilli: 10_000, unitPriceMinor: 100_000 }) }),
    ]))
  })

  it('marks remote materials as deleted when they are removed from a quotation', async () => {
    const api = transport()
    vi.mocked(api.listMaterialsForQuotation).mockResolvedValue([
      { id: 'item-1', quotation_id: 'quote-1', payload: { id: 'item-1' }, updated_at: '2026-08-30T10:00:00.000Z', version: 1 },
      { id: 'item-old', quotation_id: 'quote-1', payload: { id: 'item-old' }, updated_at: '2026-08-30T10:00:00.000Z', version: 1 },
    ])
    const snapshot = quotationSnapshotFactory()
    snapshot.materialItems = snapshot.materialItems.filter((item) => item.id === 'item-1')
    const operation: OutboxOperation = {
      id: 'quotation:1', entityType: 'quotation', entityId: snapshot.quotation.id,
      action: 'upsert', payload: snapshot, createdAt: snapshot.quotation.updatedAt,
      nextAttemptAt: snapshot.quotation.updatedAt, attempt: 0,
    }

    await new SupabaseCloudAdapter(api, 'owner-1').push(operation)

    expect(api.upsert).toHaveBeenCalledWith('material_items', [expect.objectContaining({
      id: 'item-old', quotation_id: 'quote-1', deleted_at: snapshot.quotation.updatedAt,
    })])
  })

  it('marks all remote materials deleted when the quotation is deleted', async () => {
    const api = transport()
    vi.mocked(api.listMaterialsForQuotation).mockResolvedValue([
      { id: 'item-1', quotation_id: 'quote-1', payload: { id: 'item-1' }, updated_at: '2026-08-30T10:00:00.000Z', version: 1 },
    ])
    const operation: OutboxOperation = {
      id: 'quotation:delete', entityType: 'quotation', entityId: 'quote-1',
      action: 'delete', createdAt: '2026-08-30T12:00:00.000Z',
      nextAttemptAt: '2026-08-30T12:00:00.000Z', attempt: 0,
    }

    await new SupabaseCloudAdapter(api, 'owner-1').push(operation)

    expect(api.upsert).toHaveBeenCalledWith('material_items', [expect.objectContaining({ id: 'item-1', deleted_at: operation.createdAt })])
  })

  it('pulls all owner-scoped tables as one restore bundle', async () => {
    const api = transport()
    vi.mocked(api.list).mockImplementation(async (table) => [{ id: `${table}-1`, payload: {}, updated_at: '2026-08-30T12:00:00.000Z', version: 1 }])

    const result = await new SupabaseCloudAdapter(api, 'owner-1').pull()

    expect(api.list).toHaveBeenCalledTimes(4)
    expect(result.businessProfiles).toHaveLength(1)
    expect(result.clients).toHaveLength(1)
    expect(result.quotations).toHaveLength(1)
    expect(result.materialItems).toHaveLength(1)
  })
})
