import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  toBlob: vi.fn(),
  addImage: vi.fn(),
  addPage: vi.fn(),
  output: vi.fn(),
}))

vi.mock('html-to-image', () => ({ toBlob: mocks.toBlob }))
vi.mock('jspdf', () => ({
  jsPDF: class {
    addImage = mocks.addImage
    addPage = mocks.addPage
    output = mocks.output
  },
}))

import { exportQuotationImages, exportQuotationPdf, renderPagePng, shareOrDownload } from './exportService'

describe('quotation export service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(window, 'scrollTo').mockImplementation(() => undefined)
    mocks.toBlob.mockResolvedValue(new Blob(['png'], { type: 'image/png' }))
    mocks.output.mockReturnValue(new Blob(['pdf'], { type: 'application/pdf' }))
  })

  it('captures each canonical page as a high-resolution white PNG', async () => {
    const page = document.createElement('article')
    await renderPagePng(page)

    expect(mocks.toBlob).toHaveBeenCalledWith(page, expect.objectContaining({
      pixelRatio: 4,
      backgroundColor: '#ffffff',
      cacheBust: true,
    }))
  })

  it('returns one safely named image per page', async () => {
    const files = await exportQuotationImages([
      document.createElement('article'), document.createElement('article'),
    ], 'COT-0001 María/Rodríguez')

    expect(files.map((file) => file.name)).toEqual([
      'COT-0001-Maria-Rodriguez-pagina-1.png',
      'COT-0001-Maria-Rodriguez-pagina-2.png',
    ])
  })

  it('assembles the same captured pages into one A4 PDF', async () => {
    const scrollTo = vi.mocked(window.scrollTo)
    const file = await exportQuotationPdf([
      document.createElement('article'), document.createElement('article'),
    ], 'COT-0001 María Rodríguez')

    expect(file.name).toBe('COT-0001-Maria-Rodriguez.pdf')
    expect(mocks.addImage).toHaveBeenCalledTimes(2)
    expect(mocks.addPage).toHaveBeenCalledTimes(1)
    expect(scrollTo).toHaveBeenCalled()
  })

  it('uses Web Share for supported files and downloads otherwise', async () => {
    const files = [new File(['pdf'], 'cotizacion.pdf', { type: 'application/pdf' })]
    const share = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'canShare', { configurable: true, value: () => true })
    Object.defineProperty(navigator, 'share', { configurable: true, value: share })
    expect(await shareOrDownload(files)).toBe('shared')
    expect(share).toHaveBeenCalledWith(expect.objectContaining({ files }))

    Object.defineProperty(navigator, 'canShare', { configurable: true, value: () => false })
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined)
    vi.stubGlobal('URL', { createObjectURL: () => 'blob:test', revokeObjectURL: vi.fn() })
    expect(await shareOrDownload(files)).toBe('downloaded')
    expect(click).toHaveBeenCalledTimes(1)
    vi.unstubAllGlobals()
  })
})
