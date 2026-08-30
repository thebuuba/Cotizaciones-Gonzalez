import type { Session, SupabaseClient } from '@supabase/supabase-js'
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'

import { AuthScreen } from './AuthScreen'

export type AuthClient = SupabaseClient
interface CloudSession { client?: SupabaseClient; session?: Session }
const CloudSessionContext = createContext<CloudSession>({})

export function useCloudSession(): CloudSession {
  return useContext(CloudSessionContext)
}

export function AuthGate({ children, client }: { children: ReactNode; client?: SupabaseClient }) {
  const [session, setSession] = useState<Session | undefined>()
  const [loading, setLoading] = useState(Boolean(client))

  useEffect(() => {
    if (!client) { setLoading(false); return }
    let active = true
    void client.auth.getSession().then(({ data }) => {
      if (active) { setSession(data.session ?? undefined); setLoading(false) }
    })
    const { data } = client.auth.onAuthStateChange((_event, nextSession) => {
      if (active) { setSession(nextSession ?? undefined); setLoading(false) }
    })
    return () => { active = false; data.subscription.unsubscribe() }
  }, [client])

  const value = useMemo(() => ({ client, session }), [client, session])
  if (!client) return <CloudSessionContext.Provider value={value}>{children}</CloudSessionContext.Provider>
  if (loading) return <main className="loading-state">Preparando respaldo…</main>
  if (!session) return <AuthScreen client={client} />
  return <CloudSessionContext.Provider value={value}>{children}</CloudSessionContext.Provider>
}
