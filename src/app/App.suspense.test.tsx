import { render, screen } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'

afterEach(() => {
  vi.doUnmock('../features/settings/SettingsPage')
  vi.resetModules()
  window.history.replaceState({}, '', '/')
})

it('renders the requested primary screen directly inside the persistent app shell', async () => {
  vi.resetModules()
  vi.doMock('../features/settings/SettingsPage', () => ({
    SettingsPage: () => <h1>Ajustes</h1>,
  }))
  window.history.replaceState({}, '', '/ajustes')
  const { App } = await import('./App')

  render(<App />)

  expect(screen.getByRole('main')).toBeInTheDocument()
  expect(screen.getByRole('navigation', { name: 'Navegación principal' })).toBeInTheDocument()
  expect(screen.getByRole('heading', { level: 1, name: 'Ajustes' })).toBeInTheDocument()
  expect(screen.queryByText('Cargando pantalla…')).not.toBeInTheDocument()
})
