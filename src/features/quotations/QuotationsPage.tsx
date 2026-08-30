import { Copy, FileText, Pencil, Search, Trash2 } from 'lucide-react'
import { useDeferredValue, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import { StatusBadge } from '../../components/StatusBadge'
import { calculateQuotationTotals, formatMoney } from '../../domain/money'
import type { QuotationSnapshot, QuotationStatus } from '../../domain/types'

export function QuotationsPage({ quotations, onDuplicate, onDelete }: {
  quotations: QuotationSnapshot[]
  onDuplicate: (id: string) => void | Promise<void>
  onDelete: (id: string) => void | Promise<void>
}) {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<QuotationStatus | 'all'>('all')
  const deferredSearch = useDeferredValue(search)
  const filtered = useMemo(() => quotations.filter((snapshot) => {
    const matchesSearch = `${snapshot.quotation.number} ${snapshot.quotation.clientName}`.toLocaleLowerCase('es').includes(deferredSearch.trim().toLocaleLowerCase('es'))
    return matchesSearch && (status === 'all' || snapshot.quotation.status === status)
  }), [deferredSearch, quotations, status])

  return <div className="quotations-page">
    <div className="quotation-filters"><label className="search-field"><Search aria-hidden="true" /><span className="sr-only">Buscar cotizaciones</span><input type="search" aria-label="Buscar cotizaciones" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Número o cliente" /></label><label><span>Estado</span><select aria-label="Filtrar por estado" value={status} onChange={(event) => setStatus(event.target.value as QuotationStatus | 'all')}><option value="all">Todas</option><option value="draft">Borradores</option><option value="sent">Enviadas</option><option value="approved">Aprobadas</option><option value="rejected">Rechazadas</option></select></label></div>
    <section className="quotation-list" aria-label="Lista de cotizaciones">{filtered.length ? filtered.map((snapshot) => {
      const { quotation, materialItems } = snapshot
      const total = calculateQuotationTotals(materialItems, quotation.laborMinor).totalMinor
      return <article className="quotation-list-card" key={quotation.id}><Link className="quotation-card-main" to={`/cotizaciones/${quotation.id}`}><span className="quotation-card-icon"><FileText aria-hidden="true" /></span><span><small>{quotation.number || 'Borrador nuevo'}</small><strong>{quotation.clientName}</strong><small>{quotation.clientAddress}</small></span><span className="quotation-card-total"><StatusBadge status={quotation.status} /><strong>{formatMoney(total)}</strong></span></Link><div className="quotation-card-actions"><Link className="icon-button" to={`/cotizaciones/${quotation.id}/editar`} aria-label={`Editar ${quotation.number}`}><Pencil aria-hidden="true" /></Link><button className="icon-button" type="button" onClick={() => onDuplicate(quotation.id)} aria-label={`Duplicar ${quotation.number}`}><Copy aria-hidden="true" /></button><button className="icon-button icon-button--danger" type="button" onClick={() => { if (window.confirm(`¿Eliminar ${quotation.number}?`)) void onDelete(quotation.id) }} aria-label={`Eliminar ${quotation.number}`}><Trash2 aria-hidden="true" /></button></div></article>
    }) : <div className="empty-state"><FileText aria-hidden="true" /><h2>No hay cotizaciones</h2><p>Crea una nueva cotización o cambia los filtros.</p></div>}</section>
  </div>
}
