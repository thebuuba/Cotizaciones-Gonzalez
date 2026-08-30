import { FileText, Send, ShieldCheck } from 'lucide-react'

import { StatusBadge } from '../../components/StatusBadge'
import { SyncBadge } from '../../components/SyncBadge'
import { calculateQuotationTotals, formatMoney } from '../../domain/money'
import type { QuotationSnapshot, SyncState } from '../../domain/types'

function totalOf(snapshot: QuotationSnapshot): number {
  return calculateQuotationTotals(snapshot.materialItems, snapshot.quotation.laborMinor).totalMinor
}

export function HomePage({ businessName, quotations, syncState }: { businessName: string; quotations: QuotationSnapshot[]; syncState: SyncState }) {
  const currentMonth = new Date().toISOString().slice(0, 7)
  const visible = quotations.filter(({ quotation }) => quotation.issueDate.startsWith(currentMonth))
  const total = visible.reduce((sum, item) => sum + totalOf(item), 0)
  const count = (status: QuotationSnapshot['quotation']['status']) => visible.filter((item) => item.quotation.status === status).length
  const stats = [
    { status: 'draft' as const, label: 'borrador', Icon: FileText },
    { status: 'sent' as const, label: 'enviada', Icon: Send },
    { status: 'approved' as const, label: 'aprobada', Icon: ShieldCheck },
  ]
  return <div className="dashboard">
    <section className="welcome"><span>Bienvenido</span><h2>{businessName}</h2><p>Resumen del mes</p></section>
    <section className="total-card"><span>Total cotizado este mes</span><strong>{formatMoney(total)}</strong></section>
    <section className="stats-grid" aria-label="Estados de cotizaciones">
      {stats.map(({ status, label, Icon }) => <article className={`stat-card stat-card--${status}`} aria-label={`${count(status)} ${label}`} key={status}><Icon aria-hidden="true" /><strong>{count(status)}</strong><span>{label[0]!.toUpperCase() + label.slice(1)}{count(status) === 1 ? '' : 's'}</span></article>)}
    </section>
    <SyncBadge state={syncState} />
    <section className="recent"><h3>Cotizaciones recientes</h3>{quotations.slice(0, 3).map((item) => <article className="quote-card" key={item.quotation.id}><div><small>{item.quotation.number}</small><h4>{item.quotation.clientName}</h4><span>{item.quotation.clientAddress}</span></div><div className="quote-card__aside"><StatusBadge status={item.quotation.status} /><strong>{formatMoney(totalOf(item))}</strong></div></article>)}</section>
  </div>
}
