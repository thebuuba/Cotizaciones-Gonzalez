export function sanitizeExportName(value: string): string {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-|-$/g, '') || 'cotizacion'
}

export type ExportStage = 'assets' | 'capture' | 'file' | 'pdf' | 'share' | 'download'
export type ExportProgress = (stage: ExportStage, details?: Record<string, unknown>) => void | Promise<void>

async function waitForAssets(element: HTMLElement): Promise<void> {
  if (document.fonts) await document.fonts.ready
  const images = Array.from(element.querySelectorAll('img'))
  await Promise.all(images.map(async (image) => {
    if (image.complete && image.naturalWidth > 0) return
    try { await image.decode?.() } catch { /* ignore */ }
  }))
  await new Promise<void>((resolve) => setTimeout(resolve, 100))
}

function isMobileBrowser(): boolean {
  return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || navigator.maxTouchPoints > 1
}

async function capturePage(element: HTMLElement, pixelRatio: number): Promise<Blob | null> {
  const { toBlob } = await import('html-to-image')
  return toBlob(element, { pixelRatio, backgroundColor: '#ffffff', cacheBust: false, skipAutoScale: false })
}

export async function renderPagePng(element: HTMLElement, onProgress?: ExportProgress): Promise<Blob> {
  await onProgress?.('assets', { width: element.offsetWidth, height: element.offsetHeight })
  await waitForAssets(element)
  if (element.offsetWidth < 100 || element.offsetHeight < 100) throw new Error('La página de la cotización no tiene un tamaño válido para exportar.')

  // The export document is rendered at a fixed 794px A4 width. 2x therefore
  // produces roughly 1588x2246px: sharp enough for small text while staying
  // well below the canvas sizes that caused older phones to abort exports.
  const ratios = isMobileBrowser() ? [2, 1.75, 1.5, 1.25] : [3, 2.5, 2]
  let lastError: unknown
  for (const ratio of ratios) {
    try {
      await onProgress?.('capture', { ratio, width: element.offsetWidth, height: element.offsetHeight })
      const blob = await capturePage(element, ratio)
      if (blob) return blob
    } catch (error) {
      lastError = error
      console.warn(`Captura a ${ratio}x falló.`, error)
    }
  }
  throw lastError instanceof Error ? lastError : new Error('No se pudo crear la exportación en este dispositivo.')
}

const releaseMemory = () => new Promise<void>((resolve) => setTimeout(resolve, isMobileBrowser() ? 150 : 20))

export async function exportQuotationImages(elements: readonly HTMLElement[], baseName: string, onProgress?: ExportProgress): Promise<File[]> {
  if (!elements.length) throw new Error('No hay páginas para exportar.')
  const safeName = sanitizeExportName(baseName)
  const files: File[] = []
  for (const [index, element] of elements.entries()) {
    const blob = await renderPagePng(element, onProgress)
    const file = new File([blob], elements.length === 1 ? `${safeName}.png` : `${safeName}-pagina-${index + 1}.png`, { type: 'image/png' })
    files.push(file)
    await onProgress?.('file', { page: index + 1, bytes: file.size })
    await releaseMemory()
  }
  return files
}

export async function exportQuotationPdf(elements: readonly HTMLElement[], baseName: string, onProgress?: ExportProgress): Promise<File> {
  if (!elements.length) throw new Error('No hay páginas para exportar.')
  const { jsPDF } = await import('jspdf')
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4', compress: true, precision: 12 })
  for (const [index, element] of elements.entries()) {
    if (index > 0) pdf.addPage('a4', 'portrait')
    const blob = await renderPagePng(element, onProgress)
    // Uint8Array avoids a second base64 copy in memory and preserves the PNG
    // pixels exactly, which improves reliability and quality on mobile.
    const bytes = new Uint8Array(await blob.arrayBuffer())
    pdf.addImage(bytes, 'PNG', 0, 0, 210, 297, undefined, 'MEDIUM')
    await onProgress?.('pdf', { page: index + 1, imageBytes: blob.size })
    await releaseMemory()
  }
  const file = new File([pdf.output('blob')], `${sanitizeExportName(baseName)}.pdf`, { type: 'application/pdf' })
  await onProgress?.('file', { bytes: file.size })
  return file
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
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000)
}

export async function shareOrDownload(files: File[], onShareOpening?: () => void | Promise<void>, onProgress?: ExportProgress): Promise<'shared' | 'downloaded'> {
  if (navigator.share && navigator.canShare?.({ files })) {
    try {
      await onProgress?.('share', { files: files.length, bytes: files.reduce((sum, file) => sum + file.size, 0) })
      await onShareOpening?.()
      await navigator.share({ files, title: 'Cotización' })
      return 'shared'
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return 'shared'
      console.warn('Web Share falló; usando descarga.', error)
    }
  }
  await onProgress?.('download', { files: files.length })
  files.forEach(downloadFile)
  return 'downloaded'
}
