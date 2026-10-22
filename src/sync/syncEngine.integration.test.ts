import { afterEach, expect, it } from 'vitest'

import { AppDatabase } from '../db/database'
import { DexieOutboxRepository, DexieQuotationRepository } from '../db/repositories'
import { quotationSnapshotFactory } from '../test/factories'
import { DexieRestoreStore } from './localRestore'
import { SyncEngine, type CloudBackup } from './syncEngine'

const databases: AppDatabase[] = []
afterEach(async () => { await Promise.all(databases.splice(0).map(db => db.delete())) })

it('uploads an edit queued during a running sync without waiting for the next periodic retry', async () => {
  const db = new AppDatabase(`sync-concurrent-${crypto.randomUUID()}`)
  databases.push(db)
  const snapshot = quotationSnapshotFactory()
  const quotes = new DexieQuotationRepository(db)
  await quotes.save(snapshot)
  const pushed: string[] = []
  let firstPull = true
  const engine = new SyncEngine({
    outbox: new DexieOutboxRepository(db), local: new DexieRestoreStore(db), isOnline: () => true,
    cloud: {
      push: async operation => { pushed.push(operation.createdAt) },
      pull: async (): Promise<CloudBackup> => {
        if (firstPull) {
          firstPull = false
          await quotes.save({ ...snapshot, quotation: { ...snapshot.quotation, observations: 'Edited during sync', updatedAt: '2026-08-30T12:00:00.000Z' } })
          void engine.run()
        }
        return { businessProfiles: [], clients: [], quotations: [], materialItems: [] }
      },
    },
  })

  await engine.run()

  expect(await db.outbox.count()).toBe(0)
  expect(pushed.at(-1)).toBe('2026-08-30T12:00:00.000Z')
  expect(engine.getState()).toBe('synced')
})

it('uploads a save that arrives during the final local restore', async () => {
  const db = new AppDatabase(`sync-restore-race-${crypto.randomUUID()}`)
  databases.push(db)
  const snapshot = quotationSnapshotFactory()
  const restore = new DexieRestoreStore(db)
  let firstRestore = true
  const pushed: string[] = []
  const engine = new SyncEngine({
    outbox: new DexieOutboxRepository(db), isOnline: () => true,
    cloud: {
      push: async operation => { pushed.push(operation.entityType) },
      pull: async () => ({ businessProfiles: [], clients: [], quotations: [], materialItems: [] }),
    },
    local: { restore: async (backup, protectedEntities) => {
      if (firstRestore) {
        firstRestore = false
        await new DexieQuotationRepository(db).save(snapshot)
        void engine.run()
      }
      await restore.restore(backup, protectedEntities)
    } },
  })

  await engine.run()

  expect(await db.outbox.count()).toBe(0)
  expect(pushed).toContain('quotation')
  expect(engine.getState()).toBe('synced')
})

it('protects a quotation and its materials beyond the first 1000 pending operations', async () => {
  const db = new AppDatabase(`sync-backlog-${crypto.randomUUID()}`)
  databases.push(db)
  const snapshot = quotationSnapshotFactory()
  await new DexieQuotationRepository(db).save(snapshot)
  await db.outbox.clear()
  await db.outbox.bulkPut(Array.from({ length: 1001 }, (_, index) => ({
    id: `pending-${index}`, entityType: 'quotation' as const,
    entityId: index === 1000 ? snapshot.quotation.id : `queued-${index}`,
    action: 'upsert' as const, payload: snapshot,
    createdAt: new Date(Date.UTC(2026, 7, 29, 0, 0, index)).toISOString(),
    nextAttemptAt: '2099-01-01T00:00:00.000Z', attempt: 1,
  })))
  const engine = new SyncEngine({
    outbox: new DexieOutboxRepository(db), local: new DexieRestoreStore(db), isOnline: () => true,
    cloud: { push: async () => { throw new Error('These operations are not due yet') }, pull: async () => ({
      businessProfiles: [], clients: [], materialItems: [],
      quotations: [{ id: snapshot.quotation.id, updatedAt: '2026-08-30T12:00:00.000Z', version: 1,
        payload: { quotation: { ...snapshot.quotation, status: 'sent', updatedAt: '2026-08-30T12:00:00.000Z' }, materialIds: [] } }],
    }) },
  })

  await engine.run()

  expect((await db.quotations.get(snapshot.quotation.id))?.status).toBe('approved')
  expect(await db.materialItems.count()).toBe(2)
  expect(await db.outbox.count()).toBe(1001)
  expect(engine.getState()).toBe('pending')
})
