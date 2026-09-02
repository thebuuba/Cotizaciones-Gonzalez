import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'

import { App } from './App'

describe('App shell', () => {
  beforeEach(() => window.history.replaceState({}, '', '/'))
  it('shows the primary destinations without a redundant top banner', () => {
    render(<App />)

    expect(screen.queryByRole('banner')).not.toBeInTheDocument()
    expect(screen.getByRole('navigation', { name: 'Navegación principal' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Saltar al contenido' })).toHaveAttribute('href', '#main-content')
    expect(screen.getByRole('main')).toHaveAttribute('id', 'main-content')

    for (const destination of ['Inicio', 'Cotizaciones', 'Clientes', 'Ajustes']) {
      expect(screen.getByRole('link', { name: destination })).toBeInTheDocument()
    }
  })

  it('keeps creation inside the quotations panel instead of the bottom navigation', () => {
    render(<App />)

    const navigation = screen.getByRole('navigation', { name: 'Navegación principal' })
    expect(within(navigation).getAllByRole('link')).toHaveLength(4)
    expect(within(navigation).queryByRole('link', { name: 'Nueva cotización' })).not.toBeInTheDocument()
    expect(screen.queryByTestId('header-create-action')).not.toBeInTheDocument()
  })

  it('navigates inside the app and announces the active destination', async () => {
    const user = userEvent.setup()
    render(<App />)

    expect(screen.getByRole('link', { name: 'Inicio' })).toHaveAttribute('aria-current', 'page')
    await user.click(screen.getByRole('link', { name: 'Ajustes' }))
    await screen.findByRole('heading', { level: 1, name: 'Ajustes' })
    expect(screen.getByRole('link', { name: 'Ajustes' })).toHaveAttribute('aria-current', 'page')
  })

  it('restarts the subtle page entrance when the route changes', async () => {
    const user = userEvent.setup()
    render(<App />)

    const initialPage = screen.getByRole('main').querySelector('.route-transition')
    expect(initialPage).toBeInTheDocument()

    await user.click(screen.getByRole('link', { name: 'Ajustes' }))
    await screen.findByRole('heading', { level: 1, name: 'Ajustes' })

    const nextPage = screen.getByRole('main').querySelector('.route-transition')
    expect(nextPage).not.toBe(initialPage)
  })

  it('gives every primary destination a large accessible page title', async () => {
    const user = userEvent.setup()
    render(<App />)

    expect(screen.getByRole('heading', { level: 1, name: 'Acabados Modernos Gonzalez' })).toBeInTheDocument()
    for (const destination of ['Cotizaciones', 'Clientes', 'Ajustes']) {
      await user.click(screen.getByRole('link', { name: destination }))
      expect(await screen.findByRole('heading', { level: 1, name: destination })).toBeInTheDocument()
    }
  })

  it('opens the material quotation editor from the quotations panel', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('link', { name: 'Cotizaciones' }))
    await screen.findByRole('heading', { level: 1, name: 'Cotizaciones' })
    await user.click(screen.getByRole('link', { name: 'Nueva cotización' }))

    expect(await screen.findByRole('heading', { name: 'Nueva cotización' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Agregar material' })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Nueva cotización' })).not.toBeInTheDocument()
  })
})
