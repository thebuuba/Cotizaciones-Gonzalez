import type { SupabaseClient } from '@supabase/supabase-js'
import { describe, expect, it, vi } from 'vitest'
import { SupabaseBackupTransport } from './supabase'

function paginatedClient(failAt?: number) {
  const rows = Array.from({ length: 1203 }, (_, id) => ({ id: String(id).padStart(5, '0') }))
  const filters: unknown[][] = []
  const offsets: number[] = []
  const client = { from: vi.fn(() => {
    const query = {
      select: () => query,
      eq: (...args: unknown[]) => { filters.push(args); return query },
      order: () => query,
      range: async (from: number, to: number) => {
        offsets.push(from)
        return { data: rows.slice(from, to + 1), error: from === failAt ? new Error('Disconnected') : null }
      },
      then: (resolve: (result: unknown) => void) => resolve({ data: rows.slice(0, 500), error: null }),
    }
    return query
  }) }
  return { transport: new SupabaseBackupTransport(client as unknown as SupabaseClient, 'owner-1'), rows, offsets, filters }
}

describe('backup pagination', () => {
  it('loads every page and scopes each request to the owner', async () => {
    const { transport, rows, offsets, filters } = paginatedClient()
    expect(await transport.list('clients')).toEqual(rows)
    expect(offsets).toEqual([0, 500, 1000])
    expect(filters.filter(([key]) => key === 'owner_id')).toEqual(Array(3).fill(['owner_id', 'owner-1']))
  })
  it('also paginates materials while keeping the quotation filter', async () => {
    const { transport, rows, filters } = paginatedClient()
    expect(await transport.listMaterialsForQuotation('quote-1')).toEqual(rows)
    expect(filters.filter(([key]) => key === 'quotation_id')).toEqual(Array(3).fill(['quotation_id', 'quote-1']))
  })
  it('rejects a failed later page instead of restoring a partial backup', async () => {
    const { transport } = paginatedClient(500)
    await expect(transport.list('clients')).rejects.toThrow('Disconnected')
  })
})
