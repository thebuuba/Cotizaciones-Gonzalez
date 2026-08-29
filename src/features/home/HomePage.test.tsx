import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { quotationSnapshotFactory } from '../../test/factories'
import { HomePage } from './HomePage'

describe('HomePage', () => {
  it('summarizes the current month and shows recent quotations', () => {
    const approved = quotationSnapshotFactory()
    const sent = quotationSnapshotFactory()
    sent.quotation.id = 'quote-2'
    sent.quotation.number = 'COT-0002'
    sent.quotation.projectName = 'Proyecto Jardín'
    sent.quotation.status = 'sent'
    sent.quotation.discount = { type: 'none', value: 0 }
    sent.workItems = [{ id: 'item-3', quotationId: 'quote-2', description: 'Cerámica exterior', priceMinor: 50_000_00, position: 0 }]

    render(<HomePage businessName="Construcciones González" quotations={[approved, sent]} syncState="synced" />)

    expect(screen.getByRole('heading', { name: 'Construcciones González' })).toBeInTheDocument()
    expect(screen.getByText(/RD[$]\s?185,000\.00/)).toBeInTheDocument()
    expect(screen.getByLabelText('1 aprobada')).toBeInTheDocument()
    expect(screen.getByLabelText('1 enviada')).toBeInTheDocument()
    expect(screen.getByText('Remodelación Cocina')).toBeInTheDocument()
    expect(screen.getByText('Proyecto Jardín')).toBeInTheDocument()
    expect(screen.getByText('Sincronizado')).toBeInTheDocument()
  })
})
