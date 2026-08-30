import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import type { ClientRecord } from '../../db/repositories'
import { ClientForm } from './ClientForm'
import { ClientsPage } from './ClientsPage'

const records: ClientRecord[] = [
  { client: { id: 'c1', name: 'María García', phone: '809-111-1111', email: 'maria@example.com', address: 'Santo Domingo', updatedAt: '2026-08-29T12:00:00.000Z' }, locations: [{ id: 'l1', clientId: 'c1', label: 'Casa', address: 'Piantini', updatedAt: '2026-08-29T12:00:00.000Z' }] },
  { client: { id: 'c2', name: 'Carlos López', phone: '809-222-2222', email: '', address: 'Santiago', updatedAt: '2026-08-29T12:00:00.000Z' }, locations: [] },
]

describe('ClientsPage', () => {
  it('filters clients without losing their project locations', async () => {
    const user = userEvent.setup()
    render(<ClientsPage clients={records} onSave={vi.fn()} onStartQuotation={vi.fn()} />)
    await user.type(screen.getByRole('searchbox', { name: 'Buscar clientes' }), 'María')
    expect(screen.getByText('María García')).toBeInTheDocument()
    expect(screen.queryByText('Carlos López')).not.toBeInTheDocument()
    expect(screen.getByText('Casa · Piantini')).toBeInTheDocument()
  })

  it('starts a quotation with the selected project location', async () => {
    const user = userEvent.setup()
    const onStartQuotation = vi.fn()
    render(<ClientsPage clients={records} onSave={vi.fn()} onStartQuotation={onStartQuotation} />)
    await user.click(screen.getByRole('button', { name: 'Cotizar en Casa para María García' }))
    expect(onStartQuotation).toHaveBeenCalledWith('c1', 'l1')
  })

  it('starts from the contact address when a client has no project locations', async () => {
    const user = userEvent.setup()
    const onStartQuotation = vi.fn()
    render(<ClientsPage clients={records} onSave={vi.fn()} onStartQuotation={onStartQuotation} />)
    await user.click(screen.getByRole('button', { name: 'Cotizar para Carlos López' }))
    expect(onStartQuotation).toHaveBeenCalledWith('c2')
  })

  it('opens an existing client with contact and locations ready to edit', async () => {
    const user = userEvent.setup()
    render(<ClientsPage clients={records} onSave={vi.fn()} onStartQuotation={vi.fn()} />)
    await user.click(screen.getByRole('button', { name: 'Editar María García' }))
    expect(screen.getByLabelText('Nombre del cliente')).toHaveValue('María García')
    expect(screen.getByLabelText('Dirección de contacto')).toHaveValue('Santo Domingo')
    expect(screen.getByLabelText('Nombre de ubicación 1')).toHaveValue('Casa')
  })
})

describe('ClientForm', () => {
  it('shows useful errors and retains entered contact data', async () => {
    const user = userEvent.setup()
    render(<ClientForm onSave={vi.fn()} onCancel={vi.fn()} />)
    await user.type(screen.getByLabelText('Correo electrónico'), 'incorrecto')
    await user.click(screen.getByRole('button', { name: 'Guardar cliente' }))
    expect(screen.getByText('Escribe el nombre del cliente.')).toBeInTheDocument()
    expect(screen.getByText('Escribe un correo válido.')).toBeInTheDocument()
    expect(screen.getByLabelText('Correo electrónico')).toHaveValue('incorrecto')
  })

  it('saves multiple project locations separately from the contact address', async () => {
    const user = userEvent.setup()
    const onSave = vi.fn()
    render(<ClientForm onSave={onSave} onCancel={vi.fn()} />)
    await user.type(screen.getByLabelText('Nombre del cliente'), 'María García')
    await user.type(screen.getByLabelText('Dirección de contacto'), 'Santo Domingo')
    await user.type(screen.getByLabelText('Nombre de ubicación 1'), 'Casa')
    await user.type(screen.getByLabelText('Dirección de ubicación 1'), 'Piantini')
    await user.click(screen.getByRole('button', { name: 'Agregar otra ubicación' }))
    await user.type(screen.getByLabelText('Nombre de ubicación 2'), 'Apartamento')
    await user.type(screen.getByLabelText('Dirección de ubicación 2'), 'Naco')
    await user.click(screen.getByRole('button', { name: 'Guardar cliente' }))
    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ client: expect.objectContaining({ address: 'Santo Domingo' }), locations: [expect.objectContaining({ label: 'Casa', address: 'Piantini' }), expect.objectContaining({ label: 'Apartamento', address: 'Naco' })] }))
  })
})
