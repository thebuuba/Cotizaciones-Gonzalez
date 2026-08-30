import Dexie, { type EntityTable } from 'dexie'

import type { BusinessProfile, Client, MaterialItem, ProjectLocation, Quotation } from '../domain/types'
import { normalizeBusinessProfile } from './defaults'

interface LegacyWorkItem {
  id: string
  quotationId: string
  description: string
  priceMinor: number
  position: number
}

interface LegacyQuotationImage {
  id: string
  quotationId: string
  position: number
}

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
  workItems!: EntityTable<LegacyWorkItem, 'id'>
  quotationImages!: EntityTable<LegacyQuotationImage, 'id'>
  materialItems!: EntityTable<MaterialItem, 'id'>
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
    this.version(2).stores({
      businessProfiles: 'id, updatedAt, deletedAt',
      clients: 'id, name, updatedAt, deletedAt',
      projectLocations: 'id, clientId, updatedAt, deletedAt',
      quotations: 'id, number, clientId, status, updatedAt, deletedAt',
      workItems: 'id, quotationId, [quotationId+position]',
      quotationImages: 'id, quotationId, [quotationId+position]',
      materialItems: 'id, quotationId, [quotationId+position]',
      outbox: 'id, [nextAttemptAt+createdAt], entityId, entityType',
    }).upgrade(async (transaction) => {
      const legacyItems = await transaction.table<LegacyWorkItem, string>('workItems').toArray()
      if (legacyItems.length) {
        await transaction.table<MaterialItem, string>('materialItems').bulkPut(legacyItems.map((item) => ({
          id: item.id,
          quotationId: item.quotationId,
          description: item.description,
          quantityMilli: 1_000,
          unit: 'unidad',
          unitPriceMinor: item.priceMinor,
          position: item.position,
        })))
      }

      const clients = new Map((await transaction.table<Client, string>('clients').toArray()).map((client) => [client.id, client]))
      const locations = new Map((await transaction.table<ProjectLocation, string>('projectLocations').toArray()).map((location) => [location.id, location]))
      const legacyQuotations = await transaction.table<Record<string, unknown>, string>('quotations').toArray()
      for (const legacy of legacyQuotations) {
        if (typeof legacy.clientName === 'string') continue
        const clientId = String(legacy.clientId ?? '')
        const client = clients.get(clientId)
        const location = locations.get(String(legacy.projectLocationId ?? ''))
        await transaction.table<Quotation, string>('quotations').put({
          id: String(legacy.id),
          number: String(legacy.number ?? ''),
          clientId,
          clientName: client?.name ?? '',
          clientAddress: location?.address ?? client?.address ?? '',
          issueDate: String(legacy.issueDate ?? ''),
          status: (legacy.status as Quotation['status']) ?? 'draft',
          laborMinor: 0,
          observations: typeof legacy.notes === 'string' ? legacy.notes : '',
          templateVersion: 1,
          createdAt: String(legacy.createdAt ?? legacy.updatedAt ?? new Date().toISOString()),
          updatedAt: String(legacy.updatedAt ?? new Date().toISOString()),
          deletedAt: typeof legacy.deletedAt === 'string' ? legacy.deletedAt : undefined,
        })
      }

      const profiles = await transaction.table<Record<string, unknown>, string>('businessProfiles').toArray()
      for (const profile of profiles) {
        await transaction.table<BusinessProfile, string>('businessProfiles').put(normalizeBusinessProfile(profile))
      }
    })
  }
}

export const db = new AppDatabase()
