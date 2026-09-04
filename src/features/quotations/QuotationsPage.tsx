import { FileText, Plus, Send, ShieldCheck, XCircle } from 'lucide-react'
import { Link } from 'react-router-dom'

import { PageHeader } from '../../components/PageHeader'
import { StatusBadge } from '../../components/StatusBadge'
import { EmptyState } from '../../components/EmptyState'
import { calculateQuotationTotals, formatMoney } from '../../domain/money'
import type { QuotationSnapshot } from '../../domain/types'

export function QuotationsPage({ quotations, loading = false }: { quotations: QuotationSnapshot[]; loading?: boolean }) {
  return <div className="quotations-page">
    <div className="quotation-page-heading"><PageHeader title="Cotizaciones" /><Link aria-label="Nueva cotización" className="quotation-new-button" to="/cotizaciones/nueva"><Plus aria-hidden="true" /><span>Nueva</span></Link></div>
    {loading ? <p className="loading-state" role="status" aria-live="polite">Cargando cotizaciones…</p> : quotations.length ? <ul className="quotation-list" aria-label="Lista de cotizaciones">{quotations.map((snapshot) => {
      const { quotation, materialItems } = snapshot
      const total = calculateQuotationTotals(materialItems, quotation.laborMinor).totalMinor
      const QuotationIcon = quotation.status === 'approved' ? ShieldCheck : quotation.status === 'sent' ? Send : quotation.status === 'rejected' ? XCircle : FileText
      return <li className={`quotation-list-card quotation-list-card--${quotation.status}`} key={quotation.id}><Link className="quotation-card-main" to={`/cotizaciones/${quotation.id}`}><span className="quotation-card-icon"><QuotationIcon aria-hidden="true" /></span><span className="quotation-card-copy"><strong>{quotation.clientName}</strong><small>{quotation.clientAddress}</small></span><span className="quotation-card-total"><strong>{formatMoney(total)}</strong><StatusBadge status={quotation.status} /></span></Link></li>
    })}</ul> : <EmptyState Icon={FileText} title="No hay cotizaciones" description="Crea tu primera cotización y aparecerá en esta lista." action={<Link className="button button--primary" to="/cotizaciones/nueva">Crear cotización</Link>} />}
  </div>
}
