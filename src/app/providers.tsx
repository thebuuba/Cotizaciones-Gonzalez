import { liveQuery } from 'dexie'
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'

import { db } from '../db/database'
import { DexieBusinessProfileRepository, DexieClientRepository, DexieOutboxRepository, DexieQuotationRepository } from '../db/repositories'
import type { SyncState } from '../domain/types'
import { useCloudSession } from '../features/auth/AuthGate'
import { SupabaseBackupTransport } from '../lib/supabase'
import { SupabaseCloudAdapter } from '../sync/cloudAdapter'
import { DexieRestoreStore } from '../sync/localRestore'
import { SyncEngine } from '../sync/syncEngine'

export const quotationRepository = new DexieQuotationRepository(db)
export const businessProfileRepository = new DexieBusinessProfileRepository(db)
export const clientRepository = new DexieClientRepository(db)
export const outboxRepository = new DexieOutboxRepository(db)

interface SyncContextValue { state: SyncState; syncNow: () => Promise<void>; signOut?: () => Promise<void> }
const SyncContext = createContext<SyncContextValue>({ state: 'synced', syncNow: async () => undefined })
export const useSync = () => useContext(SyncContext)

export function SyncProvider({ children }: { children: ReactNode }) {
  const { client, session } = useCloudSession()
  const [state, setState] = useState<SyncState>(client ? 'pending' : 'offline')
  const engine = useMemo(() => {
    if (!client || !session) return undefined
    return new SyncEngine({
      outbox: outboxRepository,
      cloud: new SupabaseCloudAdapter(new SupabaseBackupTransport(client, session.user.id), session.user.id),
      local: new DexieRestoreStore(db),
    })
  }, [client, session])

  useEffect(() => {
    if (!engine) { setState('offline'); return }
    const unsubscribeState = engine.subscribe(setState)
    const queueSubscription = liveQuery(() => db.outbox.count()).subscribe(() => { void engine.run() })
    const retry = () => { void engine.run() }
    const foreground = () => { if (document.visibilityState === 'visible') retry() }
    window.addEventListener('online', retry)
    window.addEventListener('offline', retry)
    document.addEventListener('visibilitychange', foreground)
    void engine.run()
    return () => {
      unsubscribeState()
      queueSubscription.unsubscribe()
      window.removeEventListener('online', retry)
      window.removeEventListener('offline', retry)
      document.removeEventListener('visibilitychange', foreground)
    }
  }, [engine])

  const value = useMemo<SyncContextValue>(() => ({
    state,
    syncNow: () => engine?.run() ?? Promise.resolve(),
    signOut: client ? async () => { const { error } = await client.auth.signOut(); if (error) throw error } : undefined,
  }), [client, engine, state])
  return <SyncContext.Provider value={value}>{children}</SyncContext.Provider>
}
