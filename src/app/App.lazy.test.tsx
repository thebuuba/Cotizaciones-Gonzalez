import { expect, it, vi } from 'vitest'

it('loads route screens eagerly so primary tab changes do not flash the previous panel', async () => {
  vi.resetModules()
  let loadedRouteScreens = 0

  for (const modulePath of [
    '../features/quotations/QuotationsPage',
    '../features/quotations/QuotationEditor',
    '../features/quotations/QuotationDetailPage',
    '../features/clients/ClientsPage',
    '../features/settings/SettingsPage',
  ]) {
    vi.doMock(modulePath, () => {
      loadedRouteScreens += 1
      return {}
    })
  }

  await import('./App')

  expect(loadedRouteScreens).toBe(5)
})
