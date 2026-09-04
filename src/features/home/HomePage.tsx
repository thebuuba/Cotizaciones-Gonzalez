import { ChartNoAxesColumnIncreasing, FileText, Send, ShieldCheck } from 'lucide-react'
import { Link } from 'react-router-dom'

import { StatusBadge } from '../../components/StatusBadge'
import { EmptyState } from '../../components/EmptyState'
import { calculateQuotationTotals, formatMoney } from '../../domain/money'
import type { QuotationSnapshot } from '../../domain/types'

function totalOf(snapshot: QuotationSnapshot): number {
  return calculateQuotationTotals(snapshot.materialItems, snapshot.quotation.laborMinor).totalMinor
}

export function HomePage({ businessName, quotations, loading = false }: { businessName: string; quotations: QuotationSnapshot[]; loading?: boolean }) {
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
    <header className="page-header welcome" role="group"><h1>{businessName}</h1><p>Resumen del mes</p></header>
    {loading ? <section className="loading-state" role="status" aria-live="polite">Cargando resumen…</section> : <>
      <section className="total-card"><div><span>Total cotizado este mes</span><ChartNoAxesColumnIncreasing aria-hidden="true" /></div><strong>{formatMoney(total)}</strong></section>
      <section className="stats-grid" aria-label="Estados de cotizaciones">
        {stats.map(({ status, label, Icon }) => <article className={`stat-card stat-card--${status}`} aria-label={`${count(status)} ${label}`} key={status}><Icon aria-hidden="true" /><strong>{count(status)}</strong><span>{label[0]!.toUpperCase() + label.slice(1)}{count(status) === 1 ? '' : 's'}</span></article>)}
      </section>
      <section className="recent"><h2>Cotizaciones recientes</h2>{quotations.length ? <ul className="recent-list" aria-label="Cotizaciones recientes">{quotations.slice(0, 3).map((item) => {
        const QuoteIcon = item.quotation.status === 'approved' ? ShieldCheck : item.quotation.status === 'sent' ? Send : FileText
        return <li key={item.quotation.id}><Link to={`/cotizaciones/${item.quotation.id}`} className={`quote-card quote-card--${item.quotation.status}`}><span className="quote-card__icon"><QuoteIcon aria-hidden="true" /></span><div className="quote-card__content"><h3>{item.quotation.clientName}</h3><span>{item.quotation.clientAddress}</span></div><div className="quote-card__aside"><strong>{formatMoney(totalOf(item))}</strong><StatusBadge status={item.quotation.status} /></div></Link></li>
      })}</ul> : <EmptyState Icon={FileText} title="Aún no hay cotizaciones" description="Crea la primera para comenzar a medir tu trabajo." action={<Link className="button button--primary" to="/cotizaciones/nueva">Crear cotización</Link>} />}</section>
    </>}
  </div>
}
