import { Check, CloudOff, RefreshCw, TriangleAlert } from 'lucide-react'
import type { SyncState } from '../domain/types'

const content = {
  synced: { label: 'Sincronizado', Icon: Check }, pending: { label: 'Pendiente', Icon: RefreshCw },
  offline: { label: 'Sin conexión', Icon: CloudOff }, error: { label: 'Error de sincronización', Icon: TriangleAlert },
}
export function SyncBadge({ state }: { state: SyncState }) {
  const { label, Icon } = content[state]
  return <span className={`sync-badge sync-badge--${state}`}><Icon aria-hidden="true" />{label}</span>
}
