import { ArrowLeft, FileImage, FileText, Pencil } from 'lucide-react'
import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'

import { calculateQuotationTotals, formatMoney } from '../../domain/money'
import type { QuotationSnapshot, QuotationStatus } from '../../domain/types'
import { QuotationDocument } from '../export/QuotationDocument'
import { exportQuotationImages, exportQuotationPdf, shareOrDownload } from '../export/exportService'

export function QuotationDetailPage({ snapshot, onStatusChange }: {
  snapshot: QuotationSnapshot
  onStatusChange: (status: QuotationStatus) => void | Promise<void>
}) {
  const documentRef = useRef<HTMLDivElement>(null)
  const [exporting, setExporting] = useState<'pdf' | 'image' | null>(null)
  const [exportMessage, setExportMessage] = useState('')
  const totals = calculateQuotationTotals(snapshot.materialItems, snapshot.quotation.laborMinor)
  const baseName = `${snapshot.quotation.number} ${snapshot.quotation.clientName}`
  const pages = () => Array.from(documentRef.current?.querySelectorAll<HTMLElement>('[data-export-page]') ?? [])
  const exportPdf = async () => {
    setExporting('pdf')
    setExportMessage('')
    try {
      await shareOrDownload([await exportQuotationPdf(pages(), baseName)])
      setExportMessage('PDF preparado')
    } catch {
      setExportMessage('No se pudo exportar el PDF')
    } finally { setExporting(null) }
  }
  const exportImages = async () => {
    setExporting('image')
    setExportMessage('')
    try {
      await shareOrDownload(await exportQuotationImages(pages(), baseName))
      setExportMessage('Imagen preparada')
    } catch {
      setExportMessage('No se pudo exportar la imagen')
    } finally { setExporting(null) }
  }
  return <div className="quotation-detail">
    <div className="detail-toolbar"><Link className="icon-button" to="/cotizaciones" aria-label="Volver a cotizaciones"><ArrowLeft aria-hidden="true" /></Link><Link className="button button--primary detail-edit" to={`/cotizaciones/${snapshot.quotation.id}/editar`} aria-label="Editar cotización"><Pencil aria-hidden="true" />Editar</Link></div>
    <section className="detail-summary"><small>{snapshot.quotation.number}</small><h2>{snapshot.quotation.clientName}</h2><p>{snapshot.quotation.clientAddress}</p><strong>{formatMoney(totals.totalMinor)}</strong><label>Estado de la cotización<select value={snapshot.quotation.status} onChange={(event) => void onStatusChange(event.target.value as QuotationStatus)}><option value="draft">Borrador</option><option value="sent">Enviada</option><option value="approved">Aprobada</option><option value="rejected">Rechazada</option></select></label></section>
    <section className="detail-materials"><h3>Materiales</h3>{snapshot.materialItems.map((item) => <div key={item.id}><span>{item.description}</span><strong>{formatMoney(calculateQuotationTotals([item], 0).materialsMinor)}</strong></div>)}<div><span>Mano de obra</span><strong>{formatMoney(snapshot.quotation.laborMinor)}</strong></div></section>
    <section className="detail-preview"><div className="preview-heading"><h3>Vista previa</h3><div className="export-actions"><button className="button button--primary" type="button" disabled={Boolean(exporting)} onClick={() => void exportPdf()}><FileText aria-hidden="true" />{exporting === 'pdf' ? 'Creando PDF…' : 'Exportar PDF'}</button><button className="button button--quiet export-image" type="button" disabled={Boolean(exporting)} onClick={() => void exportImages()}><FileImage aria-hidden="true" />{exporting === 'image' ? 'Creando imagen…' : 'Exportar imagen'}</button></div></div><span className="export-message" aria-live="polite">{exportMessage}</span><div ref={documentRef}><QuotationDocument snapshot={snapshot} /></div></section>
  </div>
}
