import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { App } from './App'

describe('App shell', () => {
  it('shows the product identity and the four primary destinations', () => {
    render(<App />)

    expect(screen.getByRole('heading', { name: 'Cotizaciones' })).toBeInTheDocument()
    expect(screen.getByRole('navigation', { name: 'Navegación principal' })).toBeInTheDocument()

    for (const destination of ['Inicio', 'Cotizaciones', 'Clientes', 'Ajustes']) {
      expect(screen.getByRole('link', { name: destination })).toBeInTheDocument()
    }
  })

  it('offers exactly one prominently labelled quotation action', () => {
    render(<App />)

    expect(screen.getAllByRole('link', { name: 'Nueva cotización' })).toHaveLength(1)
    expect(screen.queryByTestId('header-create-action')).not.toBeInTheDocument()
  })
})
