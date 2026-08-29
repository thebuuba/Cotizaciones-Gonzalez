import type { QuotationStatus } from '../domain/types'

const labels: Record<QuotationStatus, string> = { draft: 'Borrador', sent: 'Enviada', approved: 'Aprobada', rejected: 'Rechazada' }

export function StatusBadge({ status }: { status: QuotationStatus }) {
  return <span className={`status-badge status-badge--${status}`}>{labels[status]}</span>
}
