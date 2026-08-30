import type { AppDatabase } from '../db/database'
import type { BusinessProfile, Client, MaterialItem, ProjectLocation, Quotation } from '../domain/types'
import type { CloudBackup, CloudRecord } from './syncEngine'

interface ClientPayload { client: Client; locations: ProjectLocation[] }
interface QuotationPayload { quotation: Quotation; materialIds: string[] }

function isNewer(remote: CloudRecord, localUpdatedAt?: string): boolean {
  return !localUpdatedAt || Date.parse(remote.updatedAt) >= Date.parse(localUpdatedAt)
}

export class DexieRestoreStore {
  constructor(private readonly db: AppDatabase) {}

  async restore(backup: CloudBackup, protectedEntities: Set<string>): Promise<void> {
    await this.db.transaction('rw', [
      this.db.businessProfiles, this.db.clients, this.db.projectLocations,
      this.db.quotations, this.db.materialItems,
    ], async () => {
      for (const remote of backup.businessProfiles) {
        if (protectedEntities.has(`businessProfile:${remote.id}`)) continue
        const local = await this.db.businessProfiles.get(remote.id)
        if (!isNewer(remote, local?.updatedAt)) continue
        if (remote.deletedAt) {
          if (local) await this.db.businessProfiles.put({ ...local, deletedAt: remote.deletedAt, updatedAt: remote.updatedAt })
        } else {
          await this.db.businessProfiles.put(remote.payload as BusinessProfile)
        }
      }

      for (const remote of backup.clients) {
        if (protectedEntities.has(`client:${remote.id}`)) continue
        const local = await this.db.clients.get(remote.id)
        if (!isNewer(remote, local?.updatedAt)) continue
        if (remote.deletedAt) {
          if (local) await this.db.clients.put({ ...local, deletedAt: remote.deletedAt, updatedAt: remote.updatedAt })
          continue
        }
        const payload = remote.payload as ClientPayload
        await this.db.clients.put(payload.client)
        await this.db.projectLocations.where('clientId').equals(remote.id).delete()
        await this.db.projectLocations.bulkPut(payload.locations)
      }

      const materials = new Map(backup.materialItems.map((record) => [record.id, record]))
      for (const remote of backup.quotations) {
        if (protectedEntities.has(`quotation:${remote.id}`)) continue
        const local = await this.db.quotations.get(remote.id)
        if (!isNewer(remote, local?.updatedAt)) continue
        if (remote.deletedAt) {
          if (local) await this.db.quotations.put({ ...local, deletedAt: remote.deletedAt, updatedAt: remote.updatedAt })
          continue
        }
        const payload = remote.payload as QuotationPayload
        await this.db.quotations.put(payload.quotation)
        await this.db.materialItems.where('quotationId').equals(remote.id).delete()
        const items = payload.materialIds.map((id) => materials.get(id)?.payload as MaterialItem | undefined).filter((item): item is MaterialItem => Boolean(item))
        await this.db.materialItems.bulkPut(items)
      }
    })
  }
}
