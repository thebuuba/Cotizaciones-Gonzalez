import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { quotationSnapshotFactory } from '../../test/factories'
import { QuotationDetailPage } from './QuotationDetailPage'
import { QuotationsPage } from './QuotationsPage'

function quotations() {
  const approved = quotationSnapshotFactory()
  const sent = quotationSnapshotFactory()
  sent.quotation.id = 'quote-2'
  sent.quotation.number = 'COT-0002'
  sent.quotation.clientName = 'Ana García'
  sent.quotation.clientAddress = 'Santiago'
  sent.quotation.status = 'sent'
  return [approved, sent]
}

describe('QuotationsPage', () => {
  afterEach(() => vi.restoreAllMocks())

  it('shows the compact quotation list from the approved mobile design', () => {
    render(<MemoryRouter><QuotationsPage quotations={quotations()} /></MemoryRouter>)

    expect(screen.getByText('María Rodríguez')).toBeInTheDocument()
    expect(screen.getByText('Ana García')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Nueva cotización' })).toHaveAttribute('href', '/cotizaciones/nueva')
    expect(screen.getByRole('link', { name: /María Rodríguez/ })).toHaveAttribute('href', '/cotizaciones/quote-1')
    expect(screen.getByRole('list', { name: 'Lista de cotizaciones' })).toBeInTheDocument()
    expect(screen.getAllByRole('listitem')).toHaveLength(2)
    expect(screen.queryByLabelText('Buscar cotizaciones')).not.toBeInTheDocument()
    expect(screen.queryByLabelText('Filtrar por estado')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Duplicar|Eliminar/ })).not.toBeInTheDocument()
  })
})

describe('QuotationDetailPage', () => {
  it('changes internal status without adding it to the sheet data', async () => {
    const user = userEvent.setup()
    const onStatusChange = vi.fn()
    render(<MemoryRouter><QuotationDetailPage snapshot={quotationSnapshotFactory()} onStatusChange={onStatusChange} onDelete={vi.fn()} /></MemoryRouter>)

    expect(screen.getByRole('heading', { level: 2, name: 'Materiales' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: 'Vista previa' })).toBeInTheDocument()
    await user.selectOptions(screen.getByLabelText('Estado de la cotización'), 'sent')

    expect(onStatusChange).toHaveBeenCalledWith('sent')
    await user.click(screen.getByRole('button', { name: 'Acciones' }))
    expect(screen.getByRole('link', { name: 'Editar' })).toHaveAttribute('href', '/cotizaciones/quote-1/editar')
    expect(screen.getByText('COTIZACIÓN')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Exportar PDF' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Exportar imagen' })).toBeInTheDocument()
  })
})
