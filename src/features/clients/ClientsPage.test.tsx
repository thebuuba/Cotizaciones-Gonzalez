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

const page = (overrides: Partial<Parameters<typeof ClientsPage>[0]> = {}) => <ClientsPage
  clients={records}
  onSave={vi.fn()}
  onDelete={vi.fn()}
  onStartQuotation={vi.fn()}
  {...overrides}
/>

describe('ClientsPage', () => {
  it('filters clients without losing their data', async () => {
    const user = userEvent.setup()
    render(page())
    await user.type(screen.getByRole('searchbox', { name: 'Buscar clientes' }), 'María')
    expect(screen.getByText('María García')).toBeInTheDocument()
    expect(screen.queryByText('Carlos López')).not.toBeInTheDocument()
    expect(screen.getByRole('list', { name: 'Lista de clientes' })).toBeInTheDocument()
    expect(screen.getAllByRole('listitem')).toHaveLength(1)
  })

  it('opens client creation from the empty state', async () => {
    const user = userEvent.setup()
    render(page({ clients: [] }))
    await user.click(screen.getByRole('button', { name: 'Agregar cliente' }))
    expect(screen.getByRole('heading', { name: 'Nuevo cliente' })).toBeInTheDocument()
  })

  it('opens an existing client for editing', async () => {
    const user = userEvent.setup()
    render(page())
    await user.click(screen.getByText('María García'))
    expect(screen.getByLabelText('Nombre del cliente')).toHaveValue('María García')
  })

  it('opens new client form from page action button', async () => {
    const user = userEvent.setup()
    render(page())
    await user.click(screen.getByRole('button', { name: 'Nuevo cliente' }))
    expect(screen.getByRole('heading', { name: 'Nuevo cliente' })).toBeInTheDocument()
  })

  it('exposes edit and delete actions for each swipeable client row', () => {
    render(page())
    expect(screen.getByRole('button', { name: 'Editar María García', hidden: true })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Eliminar María García', hidden: true })).toBeInTheDocument()
  })

  it('deletes a client after confirmation', async () => {
    const user = userEvent.setup()
    const onDelete = vi.fn()
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    render(page({ onDelete }))
    await user.click(screen.getByRole('button', { name: 'Eliminar María García', hidden: true }))
    expect(onDelete).toHaveBeenCalledWith(records[0])
  })
})

describe('ClientForm', () => {
  it('shows useful errors and retains entered contact data', async () => {
    const user = userEvent.setup()
    render(<ClientForm onSave={vi.fn()} onCancel={vi.fn()} />)
    await user.type(screen.getByLabelText('Correo electrónico'), 'incorrecto')
    await user.click(screen.getByRole('button', { name: 'Guardar cliente' }))
    expect(screen.getAllByText('Escribe el nombre del cliente.')).toHaveLength(2)
    expect(screen.getAllByText('Escribe un correo válido.')).toHaveLength(2)
    expect(screen.getByRole('alert')).toHaveTextContent('Escribe el nombre del cliente.')
    expect(screen.getByRole('alert')).toHaveTextContent('Escribe un correo válido.')
    expect(screen.getByRole('alert')).toHaveFocus()
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

  it('clears the error summary after a corrected submission', async () => {
    const user = userEvent.setup()
    const onSave = vi.fn()
    render(<ClientForm onSave={onSave} onCancel={vi.fn()} />)

    await user.click(screen.getByRole('button', { name: 'Guardar cliente' }))
    expect(screen.getByRole('alert')).toBeInTheDocument()
    await user.type(screen.getByLabelText('Nombre del cliente'), 'María García')
    await user.click(screen.getByRole('button', { name: 'Guardar cliente' }))

    expect(onSave).toHaveBeenCalledTimes(1)
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })
})
