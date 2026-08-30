import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { createDefaultBusinessProfile } from '../../db/defaults'
import { quotationSnapshotFactory } from '../../test/factories'
import { QuotationDocument } from './QuotationDocument'

describe('QuotationDocument', () => {
  it('renders the exact sheet sections and only the used material rows', () => {
    const snapshot = quotationSnapshotFactory()
    snapshot.business = createDefaultBusinessProfile('business-1', snapshot.business.updatedAt)
    snapshot.materialItems = snapshot.materialItems.slice(0, 1)
    render(<QuotationDocument snapshot={snapshot} />)

    const page = screen.getByTestId('quotation-page-1')
    expect(within(page).getByText('COTIZACIÓN')).toBeInTheDocument()
    expect(within(page).getByText('DATOS DEL CLIENTE')).toBeInTheDocument()
    expect(within(page).getByText('María Rodríguez')).toBeInTheDocument()
    expect(within(page).getByText('Cerámica')).toBeInTheDocument()
    expect(within(page).getAllByRole('row')).toHaveLength(2)
    for (const heading of ['#', 'DESCRIPCIÓN', 'CANTIDAD', 'UNIDAD', 'PRECIO UNITARIO', 'TOTAL']) {
      expect(within(page).getByRole('columnheader', { name: heading })).toBeInTheDocument()
    }
    expect(within(page).getByText('TOTAL DE MATERIALES')).toBeInTheDocument()
    expect(within(page).getByText('MANO DE OBRA INSTALACIÓN')).toBeInTheDocument()
    expect(within(page).getByText('TOTAL GENERAL')).toBeInTheDocument()
    expect(within(page).getByText('TÉRMINOS & CONDICIONES')).toBeInTheDocument()
    expect(within(page).getByText('OBSERVACIONES')).toBeInTheDocument()
    expect(within(page).getByText('CUENTAS BANCARIAS')).toBeInTheDocument()
    expect(within(page).getByText('Jefferson Gonzalez Del Rosario')).toBeInTheDocument()
    expect(within(page).getByLabelText('Sello Acabados Modernos Gonzalez')).toBeInTheDocument()
    expect(within(page).getByText('Dios es bueno todo el tiempo')).toBeInTheDocument()
  })

  it('never includes concepts removed from the approved sheet', () => {
    render(<QuotationDocument snapshot={quotationSnapshotFactory()} />)

    expect(screen.queryByText(/descuento|itbis|dólar|estado de la cotización/i)).not.toBeInTheDocument()
  })

  it('repeats the table heading and identity on generated continuation pages', () => {
    const snapshot = quotationSnapshotFactory()
    snapshot.materialItems = Array.from({ length: 30 }, (_, index) => ({
      ...snapshot.materialItems[0]!, id: `item-${index}`, position: index, description: `Material ${index + 1}`,
    }))
    render(<QuotationDocument snapshot={snapshot} rowHeight={() => 40} />)

    const pages = screen.getAllByTestId(/quotation-page-/)
    expect(pages.length).toBeGreaterThan(1)
    for (const page of pages) {
      expect(within(page).getByText(/Acabados Modernos Gonzalez/i)).toBeInTheDocument()
      expect(within(page).getByRole('columnheader', { name: 'DESCRIPCIÓN' })).toBeInTheDocument()
    }
  })
})
