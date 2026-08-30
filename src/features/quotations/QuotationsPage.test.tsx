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

  it('searches by client and filters by status', async () => {
    const user = userEvent.setup()
    render(<MemoryRouter><QuotationsPage quotations={quotations()} onDuplicate={vi.fn()} onDelete={vi.fn()} /></MemoryRouter>)

    expect(screen.getByText('María Rodríguez')).toBeInTheDocument()
    expect(screen.getByText('Ana García')).toBeInTheDocument()
    await user.type(screen.getByLabelText('Buscar cotizaciones'), 'Ana')
    expect(screen.queryByText('María Rodríguez')).not.toBeInTheDocument()
    await user.clear(screen.getByLabelText('Buscar cotizaciones'))
    await user.selectOptions(screen.getByLabelText('Filtrar por estado'), 'approved')
    expect(screen.getByText('María Rodríguez')).toBeInTheDocument()
    expect(screen.queryByText('Ana García')).not.toBeInTheDocument()
  })

  it('duplicates directly and requires confirmation before deletion', async () => {
    const user = userEvent.setup()
    const onDuplicate = vi.fn()
    const onDelete = vi.fn()
    vi.spyOn(window, 'confirm').mockReturnValueOnce(false).mockReturnValueOnce(true)
    render(<MemoryRouter><QuotationsPage quotations={[quotations()[0]!]} onDuplicate={onDuplicate} onDelete={onDelete} /></MemoryRouter>)

    await user.click(screen.getByRole('button', { name: 'Duplicar COT-0001' }))
    expect(onDuplicate).toHaveBeenCalledWith('quote-1')
    await user.click(screen.getByRole('button', { name: 'Eliminar COT-0001' }))
    expect(onDelete).not.toHaveBeenCalled()
    await user.click(screen.getByRole('button', { name: 'Eliminar COT-0001' }))
    expect(onDelete).toHaveBeenCalledWith('quote-1')
  })
})

describe('QuotationDetailPage', () => {
  it('changes internal status without adding it to the sheet data', async () => {
    const user = userEvent.setup()
    const onStatusChange = vi.fn()
    render(<MemoryRouter><QuotationDetailPage snapshot={quotationSnapshotFactory()} onStatusChange={onStatusChange} /></MemoryRouter>)

    await user.selectOptions(screen.getByLabelText('Estado de la cotización'), 'sent')

    expect(onStatusChange).toHaveBeenCalledWith('sent')
    expect(screen.getByRole('link', { name: 'Editar cotización' })).toHaveAttribute('href', '/cotizaciones/quote-1/editar')
    expect(screen.getByText('COTIZACIÓN')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Exportar PDF' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Exportar imagen' })).toBeInTheDocument()
  })
})
