import type { BusinessProfile, QuotationSnapshot } from '../domain/types'
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
    const [business, client, projectLocation, workItems, images] = await Promise.all([
      this.db.businessProfiles.toCollection().first(), this.db.clients.get(quotation.clientId),
      this.db.projectLocations.get(quotation.projectLocationId),
      this.db.workItems.where('quotationId').equals(id).sortBy('position'),
      this.db.quotationImages.where('quotationId').equals(id).sortBy('position'),
    ])
    if (!business || !client || !projectLocation) return undefined
    return { business, client, projectLocation, quotation, workItems, images }
  }

  async list(): Promise<QuotationSnapshot[]> {
    const rows = await this.db.quotations.filter((quote) => !quote.deletedAt).reverse().sortBy('updatedAt')
    return (await Promise.all(rows.map((quote) => this.get(quote.id)))).filter((value): value is QuotationSnapshot => Boolean(value))
  }

  async save(snapshot: QuotationSnapshot): Promise<void> {
    if (snapshot.workItems.some((item) => item.priceMinor < 0)) throw new RangeError('Work price cannot be negative.')
    await this.db.transaction('rw', [this.db.businessProfiles, this.db.clients, this.db.projectLocations, this.db.quotations, this.db.workItems, this.db.quotationImages, this.db.outbox], async () => {
      await this.db.businessProfiles.put(snapshot.business)
      await this.db.clients.put(snapshot.client)
      await this.db.projectLocations.put(snapshot.projectLocation)
      await this.db.quotations.put(snapshot.quotation)
      await this.db.workItems.where('quotationId').equals(snapshot.quotation.id).delete()
      await this.db.quotationImages.where('quotationId').equals(snapshot.quotation.id).delete()
      await this.db.workItems.bulkPut(snapshot.workItems)
      await this.db.quotationImages.bulkPut(snapshot.images)
      await this.db.outbox.put(operation(snapshot, 'upsert', snapshot.quotation.updatedAt))
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
    return this.db.outbox.orderBy('[nextAttemptAt+createdAt]').limit(limit).toArray()
  }
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
