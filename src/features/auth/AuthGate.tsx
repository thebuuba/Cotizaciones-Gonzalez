import type { Session, SupabaseClient } from '@supabase/supabase-js'
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'

import { AuthScreen } from './AuthScreen'
import { UpdatePasswordScreen } from './UpdatePasswordScreen'

export type AuthClient = SupabaseClient
interface CloudSession { client?: SupabaseClient; session?: Session }
const CloudSessionContext = createContext<CloudSession>({})

export function useCloudSession(): CloudSession {
  return useContext(CloudSessionContext)
}

export function AuthGate({ children, client }: { children: ReactNode; client?: SupabaseClient }) {
  const [session, setSession] = useState<Session | undefined>()
  const [status, setStatus] = useState<'loading' | 'signedOut' | 'signedIn' | 'recovery' | 'error'>(client ? 'loading' : 'signedOut')
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    if (!client) { setStatus('signedOut'); return }
    let active = true
    let recovering = false
    setStatus('loading')
    const { data } = client.auth.onAuthStateChange((event, nextSession) => {
      if (!active) return
      setSession(nextSession ?? undefined)
      if (event === 'PASSWORD_RECOVERY' && nextSession) {
        recovering = true
        setStatus('recovery')
      } else if (event === 'SIGNED_OUT') {
        recovering = false
        setStatus('signedOut')
      } else if (!recovering) {
        setStatus(nextSession ? 'signedIn' : 'signedOut')
      }
    })
    void client.auth.getSession().then(({ data: current, error }) => {
      if (error) throw error
      if (active && !recovering) {
        setSession(current.session ?? undefined)
        setStatus(current.session ? 'signedIn' : 'signedOut')
      }
    }).catch(() => { if (active) setStatus('error') })
    return () => { active = false; data.subscription.unsubscribe() }
  }, [attempt, client])

  const value = useMemo(() => ({ client, session }), [client, session])
  if (!client) return <main className="auth-screen"><section className="auth-card" role="alert"><h1>Configuración incompleta</h1><p>La conexión segura no está disponible. Configura Supabase durante la compilación antes de usar la aplicación.</p></section></main>
  if (status === 'loading') return <main className="loading-state">Preparando respaldo…</main>
  if (status === 'error') return <main className="auth-screen"><section className="auth-card" role="alert"><h1>No pudimos conectar</h1><p>Revisa tu internet e inténtalo otra vez.</p><button className="button button--primary" type="button" onClick={() => setAttempt((value) => value + 1)}>Reintentar</button></section></main>
  if (status === 'recovery' && session) return <UpdatePasswordScreen client={client} onComplete={() => setStatus('signedIn')} />
  if (status === 'signedOut' || !session) return <AuthScreen client={client} />
  return <CloudSessionContext.Provider value={value}>{children}</CloudSessionContext.Provider>
}
