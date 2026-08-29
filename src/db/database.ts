import Dexie, { type EntityTable } from 'dexie'

import type { BusinessProfile, Client, ProjectLocation, Quotation, QuotationImage, WorkItem } from '../domain/types'

export interface OutboxOperation {
  id: string
  entityType: 'quotation' | 'businessProfile' | 'client' | 'projectLocation'
  entityId: string
  action: 'upsert' | 'delete'
  payload?: unknown
  createdAt: string
  attempt: number
  nextAttemptAt: string
  error?: string
}

export class AppDatabase extends Dexie {
  businessProfiles!: EntityTable<BusinessProfile, 'id'>
  clients!: EntityTable<Client, 'id'>
  projectLocations!: EntityTable<ProjectLocation, 'id'>
  quotations!: EntityTable<Quotation, 'id'>
  workItems!: EntityTable<WorkItem, 'id'>
  quotationImages!: EntityTable<QuotationImage, 'id'>
  outbox!: EntityTable<OutboxOperation, 'id'>

  constructor(name = 'cotizaciones') {
    super(name)
    this.version(1).stores({
      businessProfiles: 'id, updatedAt, deletedAt',
      clients: 'id, name, updatedAt, deletedAt',
      projectLocations: 'id, clientId, updatedAt, deletedAt',
      quotations: 'id, number, clientId, status, updatedAt, deletedAt',
      workItems: 'id, quotationId, [quotationId+position]',
      quotationImages: 'id, quotationId, [quotationId+position]',
      outbox: 'id, [nextAttemptAt+createdAt], entityId, entityType',
    })
  }
}

export const db = new AppDatabase()
