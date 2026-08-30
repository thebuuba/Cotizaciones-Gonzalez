import { act, fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import type { ClientRecord } from '../../db/repositories'
import { quotationSnapshotFactory } from '../../test/factories'
import { QuotationEditor } from './QuotationEditor'

const clientRecord = (): ClientRecord => {
  const snapshot = quotationSnapshotFactory()
  return {
    client: snapshot.client,
    locations: [{
      id: 'location-1', clientId: snapshot.client.id, label: 'Casa',
      address: 'Santo Domingo Este', updatedAt: snapshot.client.updatedAt,
    }],
  }
}

describe('QuotationEditor', () => {
  it('calculates dynamic material rows and the one labor amount', async () => {
    const user = userEvent.setup()
    render(<QuotationEditor business={quotationSnapshotFactory().business} clients={[clientRecord()]} onSave={vi.fn()} />)

    await user.selectOptions(screen.getByLabelText('Cliente'), 'client-1')
    expect(screen.getByLabelText('Nombre del cliente')).toHaveValue('María Rodríguez')
    expect(screen.getByLabelText('Dirección')).toHaveValue('Santo Domingo Este')

    await user.type(screen.getByLabelText('Descripción 1'), 'Cerámica de piso')
    await user.type(screen.getByLabelText('Cantidad 1'), '1,5')
    await user.clear(screen.getByLabelText('Unidad 1'))
    await user.type(screen.getByLabelText('Unidad 1'), 'm²')
    await user.type(screen.getByLabelText('Precio unitario 1'), '1000')
    expect(screen.getByTestId('material-total-0')).toHaveTextContent(/RD[$]\s?1,500\.00/)

    await user.type(screen.getByLabelText('Mano de obra instalación'), '800')
    expect(screen.getByTestId('materials-total')).toHaveTextContent(/RD[$]\s?1,500\.00/)
    expect(screen.getByTestId('general-total')).toHaveTextContent(/RD[$]\s?2,300\.00/)

    await user.click(screen.getByRole('button', { name: 'Agregar material' }))
    expect(screen.getByLabelText('Descripción 2')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Eliminar material 2' }))
    expect(screen.queryByLabelText('Descripción 2')).not.toBeInTheDocument()
  })

  it('accepts a custom material unit beyond the suggestions', async () => {
    const user = userEvent.setup()
    render(<QuotationEditor business={quotationSnapshotFactory().business} clients={[clientRecord()]} onSave={vi.fn()} />)

    await user.clear(screen.getByLabelText('Unidad 1'))
    await user.type(screen.getByLabelText('Unidad 1'), 'cubeta')

    expect(screen.getByLabelText('Unidad 1')).toHaveValue('cubeta')
  })

  it('contains only fields from the approved sheet', () => {
    render(<QuotationEditor business={quotationSnapshotFactory().business} clients={[clientRecord()]} onSave={vi.fn()} />)

    expect(screen.getByLabelText('Fecha')).toBeInTheDocument()
    expect(screen.getByLabelText('Observaciones')).toBeInTheDocument()
    expect(screen.queryByText(/descuento/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/moneda|dólar|itbis/i)).not.toBeInTheDocument()
  })

  it('autosaves a complete quotation after 400 ms and announces success', async () => {
    vi.useFakeTimers()
    const onSave = vi.fn().mockResolvedValue(undefined)
    render(<QuotationEditor business={quotationSnapshotFactory().business} clients={[clientRecord()]} onSave={onSave} />)

    fireEvent.change(screen.getByLabelText('Cliente'), { target: { value: 'client-1' } })
    fireEvent.change(screen.getByLabelText('Descripción 1'), { target: { value: 'Cerámica' } })
    fireEvent.change(screen.getByLabelText('Cantidad 1'), { target: { value: '2' } })
    fireEvent.change(screen.getByLabelText('Unidad 1'), { target: { value: 'm²' } })
    fireEvent.change(screen.getByLabelText('Precio unitario 1'), { target: { value: '500' } })

    await act(async () => vi.advanceTimersByTimeAsync(399))
    expect(onSave).not.toHaveBeenCalled()
    await act(async () => vi.advanceTimersByTimeAsync(1))
    expect(onSave).toHaveBeenCalledTimes(1)
    expect(screen.getByText('Guardado')).toBeInTheDocument()
    vi.useRealTimers()
  })
})
