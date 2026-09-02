import { ArrowLeft, FileImage, FileText, MoreVertical, Pencil, Phone, Trash2 } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'

import { calculateQuotationTotals, formatMoney } from '../../domain/money'
import type { QuotationSnapshot, QuotationStatus } from '../../domain/types'
import { QuotationDocument } from '../export/QuotationDocument'
import { exportQuotationImages, exportQuotationPdf, shareOrDownload } from '../export/exportService'

export function QuotationDetailPage({ snapshot, onStatusChange, onDelete }: {
  snapshot: QuotationSnapshot
  onStatusChange: (status: QuotationStatus) => void | Promise<void>
  onDelete: () => void | Promise<void>
}) {
  const documentRef = useRef<HTMLDivElement>(null)
  const [exporting, setExporting] = useState<'pdf' | 'image' | null>(null)
  const [exportMessage, setExportMessage] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
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
  useEffect(() => {
    if (!menuOpen) return
    const handleClick = (e: MouseEvent) => { if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false) }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [menuOpen])
  const handleDelete = async () => { setMenuOpen(false); await onDelete() }
  return <div className="quotation-detail">
    <div className="detail-toolbar">
      <Link className="icon-button" to="/cotizaciones" aria-label="Volver a cotizaciones"><ArrowLeft aria-hidden="true" /></Link>
      <div className="actions-menu" ref={menuRef}>
        <button className="button button--primary actions-menu__trigger" type="button" onClick={() => setMenuOpen(!menuOpen)}><MoreVertical aria-hidden="true" />Acciones</button>
        {menuOpen && <div className="actions-menu__dropdown">
          <Link className="actions-menu__item" to={`/cotizaciones/${snapshot.quotation.id}/editar`} onClick={() => setMenuOpen(false)}><Pencil aria-hidden="true" />Editar</Link>
          <button className="actions-menu__item" type="button" onClick={() => { setMenuOpen(false); void navigator.clipboard.writeText(snapshot.client.phone) }}><Phone aria-hidden="true" />Contactar</button>
          <button className="actions-menu__item actions-menu__item--danger" type="button" onClick={() => void handleDelete()}><Trash2 aria-hidden="true" />Eliminar</button>
        </div>}
      </div>
    </div>
    <header className="detail-summary"><small>{snapshot.quotation.number}</small><h1>{snapshot.quotation.clientName}</h1><p>{snapshot.quotation.clientAddress}</p><strong>{formatMoney(totals.totalMinor)}</strong><label>Estado de la cotización<select value={snapshot.quotation.status} onChange={(event) => void onStatusChange(event.target.value as QuotationStatus)}><option value="draft">Borrador</option><option value="sent">Enviada</option><option value="approved">Aprobada</option><option value="rejected">Rechazada</option></select></label></header>
    <section className="detail-materials"><h2>Materiales</h2><ul className="detail-material-list">{snapshot.materialItems.map((item) => <li key={item.id}><span>{item.description}</span><strong>{formatMoney(calculateQuotationTotals([item], 0).materialsMinor)}</strong></li>)}<li><span>Mano de obra</span><strong>{formatMoney(snapshot.quotation.laborMinor)}</strong></li></ul></section>
    <section className="detail-preview"><div className="preview-heading"><h2>Vista previa</h2><div className="export-actions"><button className="button button--primary" type="button" disabled={Boolean(exporting)} onClick={() => void exportPdf()}><FileText aria-hidden="true" />{exporting === 'pdf' ? 'Creando PDF…' : 'Exportar PDF'}</button><button className="button button--quiet export-image" type="button" disabled={Boolean(exporting)} onClick={() => void exportImages()}><FileImage aria-hidden="true" />{exporting === 'image' ? 'Creando imagen…' : 'Exportar imagen'}</button></div></div><span className="export-message" aria-live="polite">{exportMessage}</span><div ref={documentRef}><QuotationDocument snapshot={snapshot} /></div></section>
  </div>
}
