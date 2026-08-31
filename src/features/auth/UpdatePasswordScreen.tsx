import type { SupabaseClient } from '@supabase/supabase-js'
import { useState, type FormEvent } from 'react'

export function UpdatePasswordScreen({ client, onComplete }: { client: SupabaseClient; onComplete: () => void }) {
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (password !== confirmation) { setMessage('Las contraseñas no coinciden.'); return }
    setLoading(true)
    setMessage('')
    try {
      const { error } = await client.auth.updateUser({ password })
      if (error) { setMessage('No se pudo cambiar la contraseña. Usa una clave más segura.'); return }
      window.history.replaceState({}, '', '/')
      onComplete()
    } catch {
      setMessage('No pudimos conectar. Revisa tu internet e inténtalo otra vez.')
    } finally {
      setLoading(false)
    }
  }

  return <main className="auth-screen"><section className="auth-card"><header className="auth-header"><span className="auth-eyebrow">Acabados Modernos</span><h1>Nueva contraseña</h1><p>Crea una clave nueva para volver a entrar.</p></header><form onSubmit={(event) => void submit(event)}><label><span>Nueva contraseña</span><input name="new-password" type="password" autoComplete="new-password" minLength={8} value={password} onChange={(event) => setPassword(event.target.value)} required /></label><label><span>Confirmar contraseña</span><input name="confirm-password" type="password" autoComplete="new-password" minLength={8} value={confirmation} onChange={(event) => setConfirmation(event.target.value)} required /></label><button className="button button--primary" type="submit" disabled={loading}>{loading ? 'Guardando…' : 'Guardar contraseña'}</button></form>{message && <span className="form-message" role="alert">{message}</span>}</section></main>
}
