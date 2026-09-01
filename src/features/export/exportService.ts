export function sanitizeExportName(value: string): string {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-|-$/g, '') || 'cotizacion'
}

async function waitForAssets(element: HTMLElement): Promise<void> {
  if (document.fonts) await document.fonts.ready
  await Promise.all(Array.from(element.querySelectorAll('img')).map(async (image) => {
    if (!image.complete && image.decode) await image.decode()
  }))
}

export async function renderPagePng(element: HTMLElement): Promise<Blob> {
  await waitForAssets(element)
  const { toBlob } = await import('html-to-image')
  const blob = await toBlob(element, { pixelRatio: 4, backgroundColor: '#ffffff', cacheBust: true })
  if (!blob) throw new Error('No se pudo crear la imagen de la cotización.')
  return blob
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
  anchor.click()
  URL.revokeObjectURL(url)
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
