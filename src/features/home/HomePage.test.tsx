import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { quotationSnapshotFactory } from '../../test/factories'
import { HomePage } from './HomePage'

describe('HomePage', () => {
  it('summarizes materials plus labor in Dominican pesos', () => {
    const approved = quotationSnapshotFactory()
    const sent = quotationSnapshotFactory()
    sent.quotation.id = 'quote-2'
    sent.quotation.number = 'COT-0002'
    sent.quotation.clientName = 'María García'
    sent.quotation.clientAddress = 'Santo Domingo Norte'
    sent.quotation.status = 'sent'
    sent.quotation.laborMinor = 0
    sent.materialItems = [{ id: 'item-3', quotationId: 'quote-2', description: 'Cerámica exterior', quantityMilli: 1_000, unit: 'unidad', unitPriceMinor: 50_000_00, position: 0 }]

    render(<HomePage businessName="Acabados Modernos Gonzalez" quotations={[approved, sent]} syncState="synced" />)

    expect(screen.getByRole('heading', { name: 'Acabados Modernos Gonzalez' })).toBeInTheDocument()
    expect(screen.getByText(/RD[$]\s?70,500\.00/)).toBeInTheDocument()
    expect(screen.getByLabelText('1 aprobada')).toBeInTheDocument()
    expect(screen.getByLabelText('1 enviada')).toBeInTheDocument()
    expect(screen.getByText('María Rodríguez')).toBeInTheDocument()
    expect(screen.getByText('María García')).toBeInTheDocument()
    expect(screen.getByText('Sincronizado')).toBeInTheDocument()
  })
})
