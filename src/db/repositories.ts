import type { BusinessProfile, Client, ProjectLocation, QuotationSnapshot } from '../domain/types'
import type { AppDatabase, OutboxOperation } from './database'

function operation(snapshot: QuotationSnapshot, action: OutboxOperation['action'], at: string): OutboxOperation {
  return {
    id: `quotation:${snapshot.quotation.id}:${action}:${at}`,
    entityType: 'quotation', entityId: snapshot.quotation.id, action,
    payload: action === 'upsert' ? snapshot : undefined,
    createdAt: at, nextAttemptAt: at, attempt: 0,
  }
}

export class DexieQuotationRepository {
  constructor(private readonly db: AppDatabase) {}

  async get(id: string, includeDeleted = false): Promise<QuotationSnapshot | undefined> {
    const quotation = await this.db.quotations.get(id)
    if (!quotation || (!includeDeleted && quotation.deletedAt)) return undefined
    const [business, client, materialItems] = await Promise.all([
      this.db.businessProfiles.toCollection().first(),
      this.db.clients.get(quotation.clientId),
      this.db.materialItems.where('quotationId').equals(id).sortBy('position'),
    ])
    if (!business || !client) return undefined
    return { business, client, quotation, materialItems }
  }

  async list(): Promise<QuotationSnapshot[]> {
    const rows = await this.db.quotations.filter((quote) => !quote.deletedAt).reverse().sortBy('updatedAt')
    return (await Promise.all(rows.map((quote) => this.get(quote.id)))).filter((value): value is QuotationSnapshot => Boolean(value))
  }

  async save(snapshot: QuotationSnapshot): Promise<void> {
    const invalid = snapshot.materialItems.some((item) =>
      !Number.isSafeInteger(item.quantityMilli) || item.quantityMilli < 0
      || !Number.isSafeInteger(item.unitPriceMinor) || item.unitPriceMinor < 0,
    ) || !Number.isSafeInteger(snapshot.quotation.laborMinor) || snapshot.quotation.laborMinor < 0
    if (invalid) throw new RangeError('Los materiales y la mano de obra no admiten valores negativos.')

    await this.db.transaction('rw', [this.db.businessProfiles, this.db.clients, this.db.quotations, this.db.materialItems, this.db.outbox], async () => {
      let savedSnapshot = snapshot
      if (!snapshot.quotation.number) {
        const existingNumber = (await this.db.quotations.get(snapshot.quotation.id))?.number
        const numbers = (await this.db.quotations.toArray()).map((item) => Number(item.number.match(/^COT-(\d+)$/)?.[1] ?? 0))
        const number = existingNumber || `COT-${String(Math.max(0, ...numbers) + 1).padStart(4, '0')}`
        savedSnapshot = { ...snapshot, quotation: { ...snapshot.quotation, number } }
      }
      await this.db.businessProfiles.put(savedSnapshot.business)
      await this.db.clients.put(savedSnapshot.client)
      await this.db.quotations.put(savedSnapshot.quotation)
      await this.db.materialItems.where('quotationId').equals(savedSnapshot.quotation.id).delete()
      await this.db.materialItems.bulkPut(savedSnapshot.materialItems)
      await this.db.outbox.put(operation(savedSnapshot, 'upsert', savedSnapshot.quotation.updatedAt))
    })
  }

  async duplicate(source: QuotationSnapshot): Promise<void> { await this.save(source) }

  async softDelete(id: string, now: Date): Promise<void> {
    const snapshot = await this.get(id, true)
    if (!snapshot) return
    const at = now.toISOString()
    snapshot.quotation.deletedAt = at
    snapshot.quotation.updatedAt = at
    await this.db.transaction('rw', this.db.quotations, this.db.outbox, async () => {
      await this.db.quotations.put(snapshot.quotation)
      await this.db.outbox.put(operation(snapshot, 'delete', at))
    })
  }
}

export class DexieOutboxRepository {
  constructor(private readonly db: AppDatabase) {}
  nextBatch(limit: number): Promise<OutboxOperation[]> {
    const now = new Date().toISOString()
    return this.db.outbox.filter((item) => item.nextAttemptAt <= now).sortBy('createdAt').then((items) => items.slice(0, limit))
  }
  pending(limit: number): Promise<OutboxOperation[]> { return this.db.outbox.toCollection().sortBy('createdAt').then((items) => items.slice(0, limit)) }
  async enqueue(item: OutboxOperation): Promise<void> { await this.db.outbox.put(item) }
  async markSucceeded(id: string): Promise<void> { await this.db.outbox.delete(id) }
  async markFailed(id: string, error: string, nextAttemptAt: string): Promise<void> {
    await this.db.outbox.where('id').equals(id).modify((item) => { item.attempt += 1; item.error = error; item.nextAttemptAt = nextAttemptAt })
  }
}

export class DexieBusinessProfileRepository {
  constructor(private readonly db: AppDatabase) {}
  get(): Promise<BusinessProfile | undefined> { return this.db.businessProfiles.toCollection().first() }
  async save(profile: BusinessProfile): Promise<void> {
    const item: OutboxOperation = { id: `businessProfile:${profile.id}:upsert:${profile.updatedAt}`, entityType: 'businessProfile', entityId: profile.id, action: 'upsert', payload: profile, createdAt: profile.updatedAt, nextAttemptAt: profile.updatedAt, attempt: 0 }
    await this.db.transaction('rw', this.db.businessProfiles, this.db.outbox, async () => {
      await this.db.businessProfiles.put(profile)
      await this.db.outbox.put(item)
    })
  }
}

export interface ClientRecord { client: Client; locations: ProjectLocation[] }
export class DexieClientRepository {
  constructor(private readonly db: AppDatabase) {}
  async list(): Promise<ClientRecord[]> {
    const clients = await this.db.clients.filter((client) => !client.deletedAt).sortBy('name')
    return Promise.all(clients.map(async (client) => ({ client, locations: await this.db.projectLocations.where('clientId').equals(client.id).filter((location) => !location.deletedAt).toArray() })))
  }
  async save(record: ClientRecord): Promise<void> {
    const item: OutboxOperation = { id: `client:${record.client.id}:upsert:${record.client.updatedAt}`, entityType: 'client', entityId: record.client.id, action: 'upsert', payload: record, createdAt: record.client.updatedAt, nextAttemptAt: record.client.updatedAt, attempt: 0 }
    await this.db.transaction('rw', this.db.clients, this.db.projectLocations, this.db.outbox, async () => {
      await this.db.clients.put(record.client)
      await this.db.projectLocations.where('clientId').equals(record.client.id).delete()
      await this.db.projectLocations.bulkPut(record.locations)
      await this.db.outbox.put(item)
    })
  }
}
