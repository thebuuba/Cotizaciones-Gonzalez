import { createClient, type SupabaseClient } from '@supabase/supabase-js'

import type { BackupTransport } from '../sync/cloudAdapter'

const url = import.meta.env.VITE_SUPABASE_URL
const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

export const isSupabaseConfigured = Boolean(url && publishableKey)
export const supabase = isSupabaseConfigured ? createClient(url, publishableKey, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
}) : undefined

export class SupabaseBackupTransport implements BackupTransport {
  constructor(private readonly client: SupabaseClient, private readonly ownerId: string) {}

  async upsert(table: Parameters<BackupTransport['upsert']>[0], row: Record<string, unknown> | Array<Record<string, unknown>>): Promise<void> {
    const { error } = await this.client.from(table).upsert(row, { onConflict: 'owner_id,id' })
    if (error) throw error
  }

  list(table: Parameters<BackupTransport['list']>[0]): ReturnType<BackupTransport['list']> {
    return this.listPages(table)
  }

  listMaterialsForQuotation(quotationId: string): ReturnType<BackupTransport['listMaterialsForQuotation']> {
    return this.listPages('material_items', quotationId)
  }

  private async listPages(table: Parameters<BackupTransport['list']>[0], quotationId?: string): ReturnType<BackupTransport['list']> {
    const rows: Awaited<ReturnType<BackupTransport['list']>> = []
    const pageSize = 500
    for (let offset = 0; ; offset += pageSize) {
      let query = this.client.from(table).select('*').eq('owner_id', this.ownerId)
      if (quotationId !== undefined) query = query.eq('quotation_id', quotationId)
      const { data, error } = await query.order('id').range(offset, offset + pageSize - 1)
      if (error) throw error
      const page = (data ?? []) as typeof rows
      rows.push(...page)
      if (page.length < pageSize) return rows
    }
  }

  async upload(path: string, body: Blob): Promise<void> {
    const { error } = await this.client.storage.from('business-assets').upload(path, body, {
      upsert: true,
      contentType: body.type || 'application/octet-stream',
    })
    if (error) throw error
  }

  async download(path: string): Promise<Blob> {
    const { data, error } = await this.client.storage.from('business-assets').download(path)
    if (error) throw error
    return data
  }
}
