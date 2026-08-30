import { ArrowLeft, Pencil } from 'lucide-react'
import { Link } from 'react-router-dom'

import { calculateQuotationTotals, formatMoney } from '../../domain/money'
import type { QuotationSnapshot, QuotationStatus } from '../../domain/types'

export function QuotationDetailPage({ snapshot, onStatusChange }: {
  snapshot: QuotationSnapshot
  onStatusChange: (status: QuotationStatus) => void | Promise<void>
}) {
  const totals = calculateQuotationTotals(snapshot.materialItems, snapshot.quotation.laborMinor)
  return <div className="quotation-detail">
    <div className="detail-toolbar"><Link className="icon-button" to="/cotizaciones" aria-label="Volver a cotizaciones"><ArrowLeft aria-hidden="true" /></Link><Link className="button button--primary detail-edit" to={`/cotizaciones/${snapshot.quotation.id}/editar`} aria-label="Editar cotización"><Pencil aria-hidden="true" />Editar</Link></div>
    <section className="detail-summary"><small>{snapshot.quotation.number}</small><h2>{snapshot.quotation.clientName}</h2><p>{snapshot.quotation.clientAddress}</p><strong>{formatMoney(totals.totalMinor)}</strong><label>Estado de la cotización<select value={snapshot.quotation.status} onChange={(event) => void onStatusChange(event.target.value as QuotationStatus)}><option value="draft">Borrador</option><option value="sent">Enviada</option><option value="approved">Aprobada</option><option value="rejected">Rechazada</option></select></label></section>
    <section className="detail-materials"><h3>Materiales</h3>{snapshot.materialItems.map((item) => <div key={item.id}><span>{item.description}</span><strong>{formatMoney(calculateQuotationTotals([item], 0).materialsMinor)}</strong></div>)}<div><span>Mano de obra</span><strong>{formatMoney(snapshot.quotation.laborMinor)}</strong></div></section>
  </div>
}
