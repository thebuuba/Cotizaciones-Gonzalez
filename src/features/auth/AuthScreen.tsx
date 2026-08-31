import type { SupabaseClient } from '@supabase/supabase-js'
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

  return <main className="auth-screen"><section className="auth-card"><header className="auth-header"><span className="auth-eyebrow">Acabados Modernos</span><h1>Bienvenido</h1><p>Accede a tus cotizaciones y respaldos.</p></header><form onSubmit={(event) => void submit(event)}><label><span>Correo electrónico</span><input type="email" inputMode="email" autoComplete="username" spellCheck="false" value={email} onChange={(event) => setEmail(event.target.value)} required /></label><label><span>Contraseña</span><input type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required /></label><button className="button button--primary" type="submit" disabled={loading}>{loading ? 'Entrando…' : 'Entrar'}</button><button className="button auth-recovery" type="button" onClick={() => void recover()} disabled={loading}>Olvidé mi contraseña</button></form>{message && <span className="form-message" role="status">{message}</span>}</section></main>
}
