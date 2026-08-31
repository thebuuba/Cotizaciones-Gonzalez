import { expect, it, vi } from 'vitest'

it('defers loading export engines until an export is requested', async () => {
  vi.resetModules()
  let loadedEngines = 0

  vi.doMock('html-to-image', () => {
    loadedEngines += 1
    return { toBlob: vi.fn() }
  })
  vi.doMock('jspdf', () => {
    loadedEngines += 1
    return { jsPDF: class {} }
  })

  await import('./exportService')

  expect(loadedEngines).toBe(0)
})
