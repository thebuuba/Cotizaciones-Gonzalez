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
  await new Promise<void>((resolve) => setTimeout(resolve, 100))
}

async function capturePage(element: HTMLElement, pixelRatio: number): Promise<Blob | null> {
  const { toBlob } = await import('html-to-image')
  return toBlob(element, {
    pixelRatio,
    backgroundColor: '#ffffff',
    cacheBust: true,
  })
}

export async function renderPagePng(element: HTMLElement): Promise<Blob> {
  await waitForAssets(element)
  if (element.offsetWidth < 100 || element.offsetHeight < 100) throw new Error('La página de la cotización no tiene un tamaño válido para exportar.')

  try {
    const blob = await capturePage(element, 2.5)
    if (blob) return blob
  } catch (error) {
    console.warn('La captura de alta resolución falló; reintentando en modo compatible.', error)
  }

  const fallback = await capturePage(element, 1.75)
  if (!fallback) throw new Error('No se pudo crear la imagen de la cotización.')
  return fallback
}

const nextPaint = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))

async function withStableViewport<T>(work: () => Promise<T>): Promise<T> {
  const previous = { left: window.scrollX, top: window.scrollY }
  window.scrollTo(0, 0)
  await nextPaint()
  try {
    return await work()
  } finally {
    await nextPaint()
    window.scrollTo(previous.left, previous.top)
  }
}

export async function exportQuotationImages(elements: readonly HTMLElement[], baseName: string): Promise<File[]> {
  if (!elements.length) throw new Error('No hay páginas para exportar.')
  const safeName = sanitizeExportName(baseName)
  return withStableViewport(async () => {
    const files: File[] = []
    for (const [index, element] of elements.entries()) {
      files.push(new File(
        [await renderPagePng(element)],
        elements.length === 1 ? `${safeName}.png` : `${safeName}-pagina-${index + 1}.png`,
        { type: 'image/png' },
      ))
    }
    return files
  })
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(reader.error ?? new Error('No se pudo leer la imagen.'))
    reader.onload = () => resolve(String(reader.result))
    reader.readAsDataURL(blob)
  })
}

export async function exportQuotationPdf(elements: readonly HTMLElement[], baseName: string): Promise<File> {
  if (!elements.length) throw new Error('No hay páginas para exportar.')
  const { jsPDF } = await import('jspdf')
  return withStableViewport(async () => {
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4', compress: true })
    for (const [index, element] of elements.entries()) {
      if (index > 0) pdf.addPage('a4', 'portrait')
      const blob = await renderPagePng(element)
      const dataUrl = await blobToDataUrl(blob)
      pdf.addImage(dataUrl, 'PNG', 0, 0, 210, 297, undefined, 'MEDIUM')
    }
    return new File([pdf.output('blob')], `${sanitizeExportName(baseName)}.pdf`, { type: 'application/pdf' })
  })
}

function downloadFile(file: File): void {
  const url = URL.createObjectURL(file)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = file.name
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export async function shareOrDownload(files: File[]): Promise<'shared' | 'downloaded'> {
  if (navigator.share && navigator.canShare?.({ files })) {
    try {
      await navigator.share({ files, title: 'Cotización' })
      return 'shared'
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return 'shared'
    }
  }
  files.forEach(downloadFile)
  return 'downloaded'
}
