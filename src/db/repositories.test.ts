import 'fake-indexeddb/auto'

import Dexie from 'dexie'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { quotationSnapshotFactory } from '../test/factories'
import { AppDatabase } from './database'
import { DexieBusinessProfileRepository, DexieClientRepository, DexieOutboxRepository, DexieQuotationRepository } from './repositories'

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

  it('commits a quotation, its materials, and one sync operation atomically', async () => {
    const snapshot = quotationSnapshotFactory()
    await quotations.save(snapshot)

    expect(await quotations.get(snapshot.quotation.id)).toEqual(snapshot)
    expect(await db.materialItems.where('quotationId').equals(snapshot.quotation.id).count()).toBe(2)
    expect(await outbox.nextBatch(25)).toMatchObject([{ entityId: 'quote-1', action: 'upsert' }])
  })

  it('replaces removed materials without leaving stale rows', async () => {
    const snapshot = quotationSnapshotFactory()
    await quotations.save(snapshot)
    await quotations.save({ ...snapshot, materialItems: [snapshot.materialItems[1]!] })

    expect((await quotations.get('quote-1'))?.materialItems.map((item) => item.id)).toEqual(['item-2'])
  })

  it('queues a tombstone when a quotation is deleted', async () => {
    await quotations.save(quotationSnapshotFactory())
    await quotations.softDelete('quote-1', new Date('2026-08-30T12:00:00.000Z'))

    expect((await quotations.get('quote-1', true))?.quotation.deletedAt).toBe('2026-08-30T12:00:00.000Z')
    expect(await outbox.nextBatch(25)).toContainEqual(expect.objectContaining({ entityId: 'quote-1', action: 'delete' }))
  })

  it('leaves no partial records when material validation aborts a save', async () => {
    const invalid = quotationSnapshotFactory()
    invalid.materialItems[0]!.unitPriceMinor = -1

    await expect(quotations.save(invalid)).rejects.toThrow('negativo')
    expect(await db.quotations.count()).toBe(0)
    expect(await db.materialItems.count()).toBe(0)
    expect(await db.outbox.count()).toBe(0)
  })

  it('persists the business profile and its cloud operation together', async () => {
    const profiles = new DexieBusinessProfileRepository(db)
    const profile = quotationSnapshotFactory().business

    await profiles.save(profile)

    expect(await profiles.get()).toEqual(profile)
    expect(await outbox.nextBatch(25)).toContainEqual(expect.objectContaining({ entityType: 'businessProfile', entityId: 'business-1' }))
  })

  it('saves a client and replaces its project locations atomically', async () => {
    const clients = new DexieClientRepository(db)
    const source = quotationSnapshotFactory()
    const location = { id: 'location-1', clientId: source.client.id, label: 'Casa', address: source.client.address, updatedAt: source.client.updatedAt }
    await clients.save({ client: source.client, locations: [location] })
    await clients.save({ client: source.client, locations: [{ ...location, id: 'location-2', label: 'Apartamento' }] })

    expect(await clients.list()).toEqual([{ client: source.client, locations: [expect.objectContaining({ id: 'location-2' })] }])
    expect(await outbox.nextBatch(25)).toContainEqual(expect.objectContaining({ entityType: 'client', entityId: 'client-1' }))
  })
})

describe('database version 2 migration', () => {
  it('converts each fixed-price work item into one material unit', async () => {
    const name = `migration-${crypto.randomUUID()}`
    const legacy = new Dexie(name)
    legacy.version(1).stores({
      businessProfiles: 'id, updatedAt, deletedAt',
      clients: 'id, name, updatedAt, deletedAt',
      projectLocations: 'id, clientId, updatedAt, deletedAt',
      quotations: 'id, number, clientId, status, updatedAt, deletedAt',
      workItems: 'id, quotationId, [quotationId+position]',
      quotationImages: 'id, quotationId, [quotationId+position]',
      outbox: 'id, [nextAttemptAt+createdAt], entityId, entityType',
    })
    await legacy.open()
    await legacy.table('workItems').add({
      id: 'legacy-item', quotationId: 'legacy-quote', description: 'Cerámica',
      priceMinor: 125_000, position: 0,
    })
    legacy.close()

    const migrated = new AppDatabase(name)
    await migrated.open()
    expect(await migrated.materialItems.get('legacy-item')).toEqual({
      id: 'legacy-item', quotationId: 'legacy-quote', description: 'Cerámica',
      quantityMilli: 1_000, unit: 'unidad', unitPriceMinor: 125_000, position: 0,
    })
    await migrated.delete()
  })
})
