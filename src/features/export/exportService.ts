export function sanitizeExportName(value: string): string {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-|-$/g, '') || 'cotizacion'
}

async function waitForAssets(element: HTMLElement): Promise<void> {
  if (document.fonts) await document.fonts.ready
  const images = Array.from(element.querySelectorAll('img'))
  await Promise.all(images.map(async (image) => {
    if (image.complete && image.naturalWidth > 0) return
    if (image.decode) {
      try { await image.decode() } catch { /* ignore */ }
    }
    await new Promise<void>((resolve) => {
      if (image.complete) { resolve(); return }
      image.onload = () => resolve()
      image.onerror = () => resolve()
    })
  }))
  await new Promise<void>((resolve) => setTimeout(resolve, 160))
}

function isMobileBrowser(): boolean {
  return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || navigator.maxTouchPoints > 1
}

async function capturePage(element: HTMLElement, pixelRatio: number): Promise<Blob | null> {
  const { toBlob } = await import('html-to-image')
  return toBlob(element, {
    pixelRatio,
    backgroundColor: '#ffffff',
    cacheBust: false,
    skipAutoScale: false,
  })
}

export async function renderPagePng(element: HTMLElement): Promise<Blob> {
  await waitForAssets(element)
  if (element.offsetWidth < 100 || element.offsetHeight < 100) throw new Error('La página de la cotización no tiene un tamaño válido para exportar.')

  // Phones use a deliberately small canvas. Older iPhones/WebViews can abort the
  // whole page on large SVG/canvas allocations before JavaScript can catch an error.
  const ratios = isMobileBrowser() ? [1.25, 1, .85] : [4, 3, 2, 1.5]
  for (const pixelRatio of ratios) {
    try {
      const blob = await capturePage(element, pixelRatio)
      if (blob) return blob
    } catch (error) {
      console.warn(`La captura a ${pixelRatio}x falló; reintentando.`, error)
    }
  }
  throw new Error('No se pudo crear la imagen de la cotización.')
}

const nextPaint = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
const releaseMobileMemory = async () => {
  await nextPaint()
  if (isMobileBrowser()) await new Promise<void>((resolve) => setTimeout(resolve, 80))
}

export async function exportQuotationImages(elements: readonly HTMLElement[], baseName: string): Promise<File[]> {
  if (!elements.length) throw new Error('No hay páginas para exportar.')
  const safeName = sanitizeExportName(baseName)
  const files: File[] = []
  for (const [index, element] of elements.entries()) {
    const blob = await renderPagePng(element)
    files.push(new File([blob], elements.length === 1 ? `${safeName}.png` : `${safeName}-pagina-${index + 1}.png`, { type: 'image/png' }))
    await releaseMobileMemory()
  }
  return files
}

export async function exportQuotationPdf(elements: readonly HTMLElement[], baseName: string): Promise<File> {
  if (!elements.length) throw new Error('No hay páginas para exportar.')
  const { jsPDF } = await import('jspdf')
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4', compress: true, precision: 10 })
  for (const [index, element] of elements.entries()) {
    if (index > 0) pdf.addPage('a4', 'portrait')
    const blob = await renderPagePng(element)
    // Object URLs avoid the extra in-memory base64 copy that was expensive on iOS.
    const objectUrl = URL.createObjectURL(blob)
    try {
      pdf.addImage(objectUrl, 'PNG', 0, 0, 210, 297, undefined, 'FAST')
    } finally {
      URL.revokeObjectURL(objectUrl)
    }
    await releaseMobileMemory()
  }
  return new File([pdf.output('blob')], `${sanitizeExportName(baseName)}.pdf`, { type: 'application/pdf' })
}

function downloadFile(file: File): void {
  const url = URL.createObjectURL(file)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = file.name
  anchor.rel = 'noopener'
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 30_000)
}

export async function shareOrDownload(files: File[], onShareOpening?: () => void | Promise<void>): Promise<'shared' | 'downloaded'> {
  if (navigator.share && navigator.canShare?.({ files })) {
    try {
      await onShareOpening?.()
      await navigator.share({ files, title: 'Cotización' })
      return 'shared'
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return 'shared'
      console.warn('Web Share falló; usando descarga compatible.', error)
    }
  }
  files.forEach(downloadFile)
  return 'downloaded'
}
