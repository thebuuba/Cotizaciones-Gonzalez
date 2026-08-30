import type { SupabaseClient } from '@supabase/supabase-js'
import { Cloud, KeyRound } from 'lucide-react'
import { useState, type FormEvent } from 'react'

export function AuthScreen({ client }: { client: SupabaseClient }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setLoading(true)
    setMessage('')
    const { error } = await client.auth.signInWithPassword({ email, password })
    if (error) setMessage('No se pudo iniciar sesión. Revisa el correo y la contraseña.')
    setLoading(false)
  }
  const recover = async () => {
    if (!email) { setMessage('Escribe tu correo para recuperar la contraseña.'); return }
    setLoading(true)
    const { error } = await client.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin })
    setMessage(error ? 'No se pudo enviar el enlace.' : 'Revisa tu correo para cambiar la contraseña.')
    setLoading(false)
  }

  return <main className="auth-screen"><section className="auth-card"><span className="auth-icon"><Cloud aria-hidden="true" /></span><h1>Tu respaldo privado</h1><p>Inicia sesión para recuperar y proteger clientes, cotizaciones y ajustes.</p><form onSubmit={(event) => void submit(event)}><label>Correo electrónico<input type="email" autoComplete="username" value={email} onChange={(event) => setEmail(event.target.value)} required /></label><label>Contraseña<input type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required /></label><button className="button button--primary" type="submit" disabled={loading}><KeyRound aria-hidden="true" />{loading ? 'Entrando…' : 'Entrar'}</button><button className="button button--quiet" type="button" onClick={() => void recover()} disabled={loading}>Olvidé mi contraseña</button></form><span className="form-message" aria-live="polite">{message}</span></section></main>
}
