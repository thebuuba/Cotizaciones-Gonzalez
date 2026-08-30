import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'

import { App } from './App'

describe('App shell', () => {
  beforeEach(() => window.history.replaceState({}, '', '/'))
  it('shows the product identity and the four primary destinations', () => {
    render(<App />)

    expect(screen.getByRole('heading', { name: 'Inicio' })).toBeInTheDocument()
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

  it('navigates inside the app and announces the active destination', async () => {
    const user = userEvent.setup()
    render(<App />)

    expect(screen.getByRole('link', { name: 'Inicio' })).toHaveAttribute('aria-current', 'page')
    await user.click(screen.getByRole('link', { name: 'Ajustes' }))
    expect(screen.getByRole('heading', { name: 'Ajustes' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Ajustes' })).toHaveAttribute('aria-current', 'page')
  })

  it('opens the material quotation editor from the central action', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('link', { name: 'Nueva cotización' }))

    expect(screen.getByRole('heading', { name: 'Datos de la hoja' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Agregar material' })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Nueva cotización' })).not.toBeInTheDocument()
  })
})
