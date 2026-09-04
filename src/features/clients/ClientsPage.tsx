import { useDeferredValue, useMemo, useState } from 'react'
import { ChevronRight, MapPin, Plus, Search, UserRound } from 'lucide-react'
import { PageHeader } from '../../components/PageHeader'
import { EmptyState } from '../../components/EmptyState'
import type { ClientRecord } from '../../db/repositories'
import { ClientForm } from './ClientForm'

const avatarColors = ['client-avatar--blue', 'client-avatar--pink', 'client-avatar--green', 'client-avatar--purple', 'client-avatar--orange']

type ClientDetailTarget = string | 'new' | null

function initials(name: string): string {
  return name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase() ?? '').join('') || 'C'
}

export function ClientsPage({ clients, loading = false, onSave, detailTarget, onOpenClient, onCloseClient }: {
  clients: ClientRecord[]
  loading?: boolean
  onSave: (record: ClientRecord) => void | Promise<void>
  onStartQuotation: (clientId: string, locationId?: string) => void
  detailTarget?: ClientDetailTarget
  onOpenClient?: (target: Exclude<ClientDetailTarget, null>) => void
  onCloseClient?: () => void
}) {
  const [search, setSearch] = useState('')
  const [localEditing, setLocalEditing] = useState<ClientRecord | 'new' | null>(null)
  const [transitionDirection, setTransitionDirection] = useState<'none' | 'forward' | 'back'>('none')
  const deferred = useDeferredValue(search)
  const filtered = useMemo(() => clients.filter(({ client }) => client.name.toLocaleLowerCase('es').includes(deferred.trim().toLocaleLowerCase('es'))), [clients, deferred])
  const isControlled = detailTarget !== undefined
  const controlledEditing = detailTarget === 'new'
    ? 'new'
    : detailTarget
      ? clients.find(({ client }) => client.id === detailTarget) ?? null
      : null
  const editing = isControlled ? controlledEditing : localEditing

  const openClient = (record: ClientRecord | 'new') => {
    setTransitionDirection('forward')
    if (isControlled && onOpenClient) {
      onOpenClient(record === 'new' ? 'new' : record.client.id)
      return
    }
    setLocalEditing(record)
  }

  const closeClient = () => {
    setTransitionDirection('back')
    if (isControlled && onCloseClient) {
      onCloseClient()
      return
    }
    setLocalEditing(null)
  }

  const transitionClass = transitionDirection === 'none' ? 'local-transition' : `local-transition local-transition--${transitionDirection}`

  if (editing) return <div className={transitionClass}><ClientForm initialValue={editing === 'new' ? undefined : editing} onCancel={closeClient} onSave={async (record) => { await onSave(record); closeClient() }}/></div>

  return <div className={`clients-page clients-panel ${transitionClass}`}>
    <PageHeader title="Clientes" subtitle="Contactos y ubicaciones"/>
    <div className="clients-toolbar">
      <label className="clients-search">
        <Search aria-hidden="true"/>
        <span className="sr-only">Buscar clientes</span>
        <input type="search" aria-label="Buscar clientes" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar" disabled={loading}/>
      </label>
      <button className="clients-add" type="button" onClick={() => openClient('new')} aria-label="Nuevo cliente" disabled={loading}><Plus aria-hidden="true"/></button>
    </div>
    {loading ? <p className="loading-state" role="status" aria-live="polite">Cargando clientes…</p> : filtered.length ? <ul className="client-list client-panel-list" aria-label="Lista de clientes">{filtered.map((record, index) => { const { client, locations } = record; const address = locations[0]?.address || client.address || 'Sin ubicación'; return <li key={client.id}>
      <button className="client-panel-card" type="button" onClick={() => openClient(record)} aria-label={`Abrir ${client.name}`}>
        <span className={`client-panel-avatar ${avatarColors[index % avatarColors.length]}`}>{initials(client.name)}</span>
        <span className="client-panel-info"><strong>{client.name}</strong><small><MapPin aria-hidden="true"/>{address}</small></span>
        <ChevronRight className="client-panel-chevron" aria-hidden="true"/>
      </button>
    </li> })}</ul> : <EmptyState Icon={UserRound} title="Sin clientes" description="Agrega tu primer cliente para comenzar." action={<button className="button button--primary" type="button" onClick={() => openClient('new')}>Agregar cliente</button>} />}
  </div>
}
