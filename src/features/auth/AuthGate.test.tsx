import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { AuthGate, type AuthClient } from './AuthGate'

describe('AuthGate', () => {
  it('blocks private data when Supabase is not configured', () => {
    render(<AuthGate client={undefined}><p>Aplicación local</p></AuthGate>)
    expect(screen.getByRole('alert')).toHaveTextContent('Configuración incompleta')
    expect(screen.queryByText('Aplicación local')).not.toBeInTheDocument()
  })

  it('shows a visual startup loader while the session is restored', () => {
    const client = {
      auth: {
        getSession: vi.fn().mockReturnValue(new Promise(() => undefined)),
        onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
      },
    } as unknown as AuthClient

    render(<AuthGate client={client}><p>Privado</p></AuthGate>)

    expect(screen.getByRole('status', { name: 'Cargando aplicación' })).toBeInTheDocument()
    expect(screen.queryByText('Preparando respaldo…')).not.toBeInTheDocument()
    expect(screen.queryByText('Privado')).not.toBeInTheDocument()
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

    await screen.findByRole('heading', { name: 'Bienvenido' })
    await user.type(screen.getByLabelText('Correo electrónico'), 'dueno@example.com')
    await user.type(screen.getByLabelText('Contraseña'), 'secreto123')
    await user.click(screen.getByRole('button', { name: 'Entrar' }))

    expect(signInWithPassword).toHaveBeenCalledWith({ email: 'dueno@example.com', password: 'secreto123' })
  })

  it('offers a retry when Supabase cannot restore the session', async () => {
    const client = {
      auth: {
        getSession: vi.fn().mockRejectedValue(new Error('sin red')),
        onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
      },
    } as unknown as AuthClient

    render(<AuthGate client={client}><p>Privado</p></AuthGate>)

    expect(await screen.findByRole('alert')).toHaveTextContent('No pudimos conectar')
    expect(screen.getByRole('button', { name: 'Reintentar' })).toBeEnabled()
    expect(screen.queryByText('Privado')).not.toBeInTheDocument()
  })

  it('lets the owner choose a new password during recovery', async () => {
    let authChange!: (event: string, session: unknown) => void
    const updateUser = vi.fn().mockResolvedValue({ error: null })
    const session = { user: { id: 'owner-1' } }
    const client = {
      auth: {
        getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
        onAuthStateChange: vi.fn().mockImplementation((callback) => {
          authChange = callback
          return { data: { subscription: { unsubscribe: vi.fn() } } }
        }),
        updateUser,
      },
    } as unknown as AuthClient
    const user = userEvent.setup()
    render(<AuthGate client={client}><p>Privado</p></AuthGate>)
    await screen.findByRole('heading', { name: 'Bienvenido' })

    act(() => authChange('PASSWORD_RECOVERY', session))
    await user.type(screen.getByLabelText('Nueva contraseña'), 'Nueva-Clave-123!')
    await user.type(screen.getByLabelText('Confirmar contraseña'), 'Nueva-Clave-123!')
    await user.click(screen.getByRole('button', { name: 'Guardar contraseña' }))

    expect(updateUser).toHaveBeenCalledWith({ password: 'Nueva-Clave-123!' })
    expect(await screen.findByText('Privado')).toBeInTheDocument()
  })
})
