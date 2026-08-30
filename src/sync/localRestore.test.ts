import { afterEach, describe, expect, it } from 'vitest'

import { AppDatabase } from '../db/database'
import { quotationSnapshotFactory } from '../test/factories'
import { DexieRestoreStore } from './localRestore'
import type { CloudBackup } from './syncEngine'

describe('DexieRestoreStore', () => {
  const databases: AppDatabase[] = []
  afterEach(async () => Promise.all(databases.map((database) => database.delete())))

  it('restores a complete profile, client, location, quotation and material graph into a fresh database', async () => {
    const db = new AppDatabase(`restore-${crypto.randomUUID()}`)
    databases.push(db)
    const snapshot = quotationSnapshotFactory()
    const backup: CloudBackup = {
      businessProfiles: [{ id: snapshot.business.id, payload: snapshot.business, updatedAt: snapshot.business.updatedAt, version: 1 }],
      clients: [{ id: snapshot.client.id, payload: { client: snapshot.client, locations: [{ id: 'location-1', clientId: snapshot.client.id, label: 'Casa', address: snapshot.client.address, updatedAt: snapshot.client.updatedAt }] }, updatedAt: snapshot.client.updatedAt, version: 1 }],
      quotations: [{ id: snapshot.quotation.id, payload: { quotation: snapshot.quotation, materialIds: snapshot.materialItems.map((item) => item.id) }, updatedAt: snapshot.quotation.updatedAt, version: 1 }],
      materialItems: snapshot.materialItems.map((item) => ({ id: item.id, quotationId: item.quotationId, payload: item, updatedAt: snapshot.quotation.updatedAt, version: 1 })),
    }

    await new DexieRestoreStore(db).restore(backup, new Set())

    expect(await db.businessProfiles.get(snapshot.business.id)).toMatchObject({ businessName: snapshot.business.businessName })
    expect(await db.clients.get(snapshot.client.id)).toMatchObject({ name: snapshot.client.name })
    expect(await db.projectLocations.get('location-1')).toMatchObject({ label: 'Casa' })
    expect(await db.quotations.get(snapshot.quotation.id)).toMatchObject({ number: 'COT-0001' })
    expect(await db.materialItems.where('quotationId').equals(snapshot.quotation.id).count()).toBe(2)
    expect(await db.outbox.count()).toBe(0)
  })

  it('does not overwrite a newer entity that still has a local pending operation', async () => {
    const db = new AppDatabase(`restore-protected-${crypto.randomUUID()}`)
    databases.push(db)
    const snapshot = quotationSnapshotFactory()
    await db.quotations.put({ ...snapshot.quotation, observations: 'Cambio local' })

    await new DexieRestoreStore(db).restore({
      businessProfiles: [], clients: [], materialItems: [],
      quotations: [{ id: snapshot.quotation.id, payload: { quotation: { ...snapshot.quotation, observations: 'Cambio remoto' }, materialIds: [] }, updatedAt: snapshot.quotation.updatedAt, version: 1 }],
    }, new Set([`quotation:${snapshot.quotation.id}`]))

    expect((await db.quotations.get(snapshot.quotation.id))?.observations).toBe('Cambio local')
  })
})
