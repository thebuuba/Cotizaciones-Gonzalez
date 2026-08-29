import 'fake-indexeddb/auto'

import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { AppDatabase } from './database'
import { DexieBusinessProfileRepository, DexieOutboxRepository, DexieQuotationRepository } from './repositories'
import { quotationSnapshotFactory } from '../test/factories'

describe('local quotation repository', () => {
  let db: AppDatabase
  let quotations: DexieQuotationRepository
  let outbox: DexieOutboxRepository

  beforeEach(() => {
    db = new AppDatabase(`test-${crypto.randomUUID()}`)
    quotations = new DexieQuotationRepository(db)
    outbox = new DexieOutboxRepository(db)
  })

  afterEach(async () => db.delete())

  it('commits a quotation, its children, and one sync operation atomically', async () => {
    const snapshot = quotationSnapshotFactory()
    await quotations.save(snapshot)

    expect(await quotations.get(snapshot.quotation.id)).toEqual(snapshot)
    expect(await db.workItems.where('quotationId').equals(snapshot.quotation.id).count()).toBe(2)
    expect(await outbox.nextBatch(25)).toMatchObject([{ entityId: 'quote-1', action: 'upsert' }])
  })

  it('replaces removed work items without leaving stale rows', async () => {
    const snapshot = quotationSnapshotFactory()
    await quotations.save(snapshot)
    await quotations.save({ ...snapshot, workItems: [snapshot.workItems[1]!] })

    expect((await quotations.get('quote-1'))?.workItems.map((item) => item.id)).toEqual(['item-2'])
  })

  it('queues a tombstone when a quotation is deleted', async () => {
    await quotations.save(quotationSnapshotFactory())
    await quotations.softDelete('quote-1', new Date('2026-08-30T12:00:00.000Z'))

    expect((await quotations.get('quote-1', true))?.quotation.deletedAt).toBe('2026-08-30T12:00:00.000Z')
    expect(await outbox.nextBatch(25)).toContainEqual(expect.objectContaining({ entityId: 'quote-1', action: 'delete' }))
  })

  it('leaves no partial records when validation aborts a save', async () => {
    const invalid = quotationSnapshotFactory()
    invalid.workItems[0]!.priceMinor = -1

    await expect(quotations.save(invalid)).rejects.toThrow('negative')
    expect(await db.quotations.count()).toBe(0)
    expect(await db.workItems.count()).toBe(0)
    expect(await db.outbox.count()).toBe(0)
  })

  it('persists the business profile and its cloud operation together', async () => {
    const profiles = new DexieBusinessProfileRepository(db)
    const profile = quotationSnapshotFactory().business

    await profiles.save(profile)

    expect(await profiles.get()).toEqual(profile)
    expect(await outbox.nextBatch(25)).toContainEqual(expect.objectContaining({ entityType: 'businessProfile', entityId: 'business-1' }))
  })
})
