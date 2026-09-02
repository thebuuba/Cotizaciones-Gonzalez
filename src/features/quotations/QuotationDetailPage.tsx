import { ChevronLeft, FileImage, FileText, MapPin, MoreHorizontal, Pencil, Phone, Trash2 } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'

import { calculateMaterialTotal, calculateQuotationTotals, formatMoney } from '../../domain/money'
import type { QuotationSnapshot, QuotationStatus } from '../../domain/types'
import { QuotationDocument } from '../export/QuotationDocument'
import { exportQuotationImages, exportQuotationPdf, shareOrDownload } from '../export/exportService'

const statusLabels: Record<QuotationStatus, string> = {
  draft: 'Borrador',
  sent: 'Enviada',
  approved: 'Aprobada',
  rejected: 'Rechazada',
}

function formatDate(value: string): string {
  const [year, month, day] = value.split('-')
  return year && month && day ? `${day}/${month}/${year}` : value
}

function formatQuantity(quantityMilli: number): string {
  return new Intl.NumberFormat('es-DO', { maximumFractionDigits: 3 }).format(quantityMilli / 1000)
}

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
    } finally {
      setExporting(null)
    }
  }

  const exportImages = async () => {
    setExporting('image')
    setExportMessage('')
    try {
      await shareOrDownload(await exportQuotationImages(pages(), baseName))
      setExportMessage('Imagen preparada')
    } catch {
      setExportMessage('No se pudo exportar la imagen')
    } finally {
      setExporting(null)
    }
  }

  useEffect(() => {
    if (!menuOpen) return
    const handleClick = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [menuOpen])

  const handleDelete = async () => {
    setMenuOpen(false)
    if (window.confirm('¿Seguro que deseas eliminar esta cotización?')) await onDelete()
  }

  return <div className="quotation-detail quotation-detail-ios">
    <nav className="quotation-detail-nav" aria-label="Navegación de la cotización">
      <Link className="quotation-detail-nav-back" to="/cotizaciones" aria-label="Volver a cotizaciones"><ChevronLeft aria-hidden="true" />Cotizaciones</Link>
      <strong>Cotización</strong>
      <div className="actions-menu" ref={menuRef}>
        <button className="quotation-detail-menu-button" type="button" onClick={() => setMenuOpen((open) => !open)} aria-label="Acciones de la cotización"><MoreHorizontal aria-hidden="true" /></button>
        {menuOpen && <div className="actions-menu__dropdown quotation-detail-menu">
          <Link className="actions-menu__item" to={`/cotizaciones/${snapshot.quotation.id}/editar`} onClick={() => setMenuOpen(false)}><Pencil aria-hidden="true" />Editar</Link>
          {snapshot.client.phone && <a className="actions-menu__item" href={`tel:${snapshot.client.phone}`} onClick={() => setMenuOpen(false)}><Phone aria-hidden="true" />Llamar</a>}
          <button className="actions-menu__item actions-menu__item--danger" type="button" onClick={() => void handleDelete()}><Trash2 aria-hidden="true" />Eliminar</button>
        </div>}
      </div>
    </nav>

    <header className="quotation-detail-hero">
      <span>{snapshot.quotation.number}</span>
      <h1>{snapshot.quotation.clientName}</h1>
      <p><MapPin aria-hidden="true" />{snapshot.quotation.clientAddress || 'Sin dirección'}</p>
      <strong>{formatMoney(totals.totalMinor)}</strong>
      <label className={`quotation-status-control quotation-status-control--${snapshot.quotation.status}`}>
        <span className="sr-only">Estado de la cotización</span>
        <select value={snapshot.quotation.status} onChange={(event) => void onStatusChange(event.target.value as QuotationStatus)} aria-label="Estado de la cotización">
          {Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
      </label>
    </header>

    <section className="quotation-detail-group" aria-labelledby="quotation-summary-title">
      <h2 id="quotation-summary-title">Resumen</h2>
      <div className="quotation-detail-card">
        <div className="quotation-detail-row"><span>Fecha</span><strong>{formatDate(snapshot.quotation.issueDate)}</strong></div>
        <div className="quotation-detail-row"><span>Materiales</span><strong>{formatMoney(totals.materialsMinor)}</strong></div>
        <div className="quotation-detail-row"><span>Mano de obra</span><strong>{formatMoney(totals.laborMinor)}</strong></div>
        <div className="quotation-detail-row quotation-detail-row--total"><span>Total general</span><strong>{formatMoney(totals.totalMinor)}</strong></div>
      </div>
    </section>

    <section className="quotation-detail-group" aria-labelledby="quotation-materials-title">
      <h2 id="quotation-materials-title">Materiales</h2>
      <div className="quotation-detail-card quotation-material-list">
        {snapshot.materialItems.map((item) => <div className="quotation-material-row" key={item.id}>
          <div><strong>{item.description}</strong><small>{formatQuantity(item.quantityMilli)} {item.unit} × {formatMoney(item.unitPriceMinor)}</small></div>
          <strong>{formatMoney(calculateMaterialTotal(item))}</strong>
        </div>)}
        {!snapshot.materialItems.length && <div className="quotation-material-empty">Sin materiales registrados.</div>}
      </div>
    </section>

    {snapshot.quotation.observations && <section className="quotation-detail-group" aria-labelledby="quotation-observations-title">
      <h2 id="quotation-observations-title">Observaciones</h2>
      <div className="quotation-detail-card quotation-detail-note">{snapshot.quotation.observations}</div>
    </section>}

    <section className="quotation-detail-group" aria-labelledby="quotation-export-title">
      <h2 id="quotation-export-title">Compartir</h2>
      <div className="quotation-detail-card quotation-detail-actions">
        <button className="quotation-detail-action" type="button" disabled={Boolean(exporting)} onClick={() => void exportPdf()}><span className="quotation-detail-action-icon"><FileText aria-hidden="true" /></span><span><strong>{exporting === 'pdf' ? 'Creando PDF…' : 'Exportar PDF'}</strong><small>Documento listo para enviar o imprimir</small></span></button>
        <button className="quotation-detail-action" type="button" disabled={Boolean(exporting)} onClick={() => void exportImages()}><span className="quotation-detail-action-icon"><FileImage aria-hidden="true" /></span><span><strong>{exporting === 'image' ? 'Creando imagen…' : 'Exportar imagen'}</strong><small>Guarda la cotización como imagen</small></span></button>
      </div>
      <span className="quotation-detail-export-message" aria-live="polite">{exportMessage}</span>
    </section>

    <section className="quotation-detail-group quotation-detail-preview" aria-labelledby="quotation-preview-title">
      <h2 id="quotation-preview-title">Vista previa</h2>
      <div className="quotation-detail-preview-frame" ref={documentRef}><QuotationDocument snapshot={snapshot} /></div>
    </section>
  </div>
}
