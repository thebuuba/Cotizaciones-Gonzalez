import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { AuthGate, type AuthClient } from './AuthGate'

describe('AuthGate', () => {
  it('keeps the PWA available in local-only mode when Supabase is not configured', () => {
    render(<AuthGate client={undefined}><p>Aplicación local</p></AuthGate>)
    expect(screen.getByText('Aplicación local')).toBeInTheDocument()
  })

  it('restores a session and otherwise signs the private owner in with email and password', async () => {
    const signInWithPassword = vi.fn().mockResolvedValue({ error: null })
    const client = {
      auth: {
        getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
        onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
        signInWithPassword,
        resetPasswordForEmail: vi.fn().mockResolvedValue({ error: null }),
        signOut: vi.fn().mockResolvedValue({ error: null }),
      },
    } as unknown as AuthClient
    const user = userEvent.setup()
    render(<AuthGate client={client}><p>Privado</p></AuthGate>)

    await screen.findByRole('heading', { name: 'Tu respaldo privado' })
    await user.type(screen.getByLabelText('Correo electrónico'), 'dueno@example.com')
    await user.type(screen.getByLabelText('Contraseña'), 'secreto123')
    await user.click(screen.getByRole('button', { name: 'Entrar' }))

    expect(signInWithPassword).toHaveBeenCalledWith({ email: 'dueno@example.com', password: 'secreto123' })
  })
})
