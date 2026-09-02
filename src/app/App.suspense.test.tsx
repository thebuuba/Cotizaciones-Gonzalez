import { render, screen } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'

afterEach(() => {
  vi.doUnmock('../features/settings/SettingsPage')
  vi.resetModules()
  window.history.replaceState({}, '', '/')
})

it('keeps the main shell available while a route screen is loading', async () => {
  vi.resetModules()
  vi.doMock('../features/settings/SettingsPage', () => new Promise(() => {}))
  window.history.replaceState({}, '', '/ajustes')
  const { App } = await import('./App')

  render(<App />)

  expect(screen.getByRole('main')).toBeInTheDocument()
  expect(screen.getByRole('navigation', { name: 'Navegación principal' })).toBeInTheDocument()
  expect(screen.getByRole('status')).toHaveTextContent('Cargando pantalla…')
})
