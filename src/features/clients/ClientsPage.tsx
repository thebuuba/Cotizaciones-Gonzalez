import { useDeferredValue, useMemo, useState } from 'react'
import { ChevronRight, MapPin, Plus, Search, UserRound } from 'lucide-react'
import { PageHeader } from '../../components/PageHeader'
import { EmptyState } from '../../components/EmptyState'
import type { ClientRecord } from '../../db/repositories'
import { ClientForm } from './ClientForm'

const avatarColors = ['client-avatar--blue', 'client-avatar--pink', 'client-avatar--green', 'client-avatar--purple', 'client-avatar--orange']

function initials(name: string): string {
  return name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase() ?? '').join('') || 'C'
}

export function ClientsPage({ clients, onSave, onStartQuotation: _onStartQuotation }: { clients: ClientRecord[]; onSave: (record: ClientRecord) => void | Promise<void>; onStartQuotation: (clientId: string, locationId?: string) => void }) {
  const [search, setSearch] = useState('')
  const [editing, setEditing] = useState<ClientRecord | 'new' | null>(null)
  const deferred = useDeferredValue(search)
  const filtered = useMemo(() => clients.filter(({ client }) => client.name.toLocaleLowerCase('es').includes(deferred.trim().toLocaleLowerCase('es'))), [clients, deferred])
  if (editing) return <ClientForm initialValue={editing === 'new' ? undefined : editing} onCancel={() => setEditing(null)} onSave={async (record) => { await onSave(record); setEditing(null) }}/>
  return <div className="clients-page clients-panel">
    <PageHeader title="Clientes" subtitle="Contactos y ubicaciones"/>
    <div className="clients-toolbar">
      <label className="clients-search">
        <Search aria-hidden="true"/>
        <span className="sr-only">Buscar clientes</span>
        <input type="search" aria-label="Buscar clientes" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar"/>
      </label>
      <button className="clients-add" type="button" onClick={() => setEditing('new')} aria-label="Nuevo cliente"><Plus aria-hidden="true"/></button>
    </div>
    {filtered.length ? <ul className="client-list client-panel-list" aria-label="Lista de clientes">{filtered.map((record, index) => { const { client, locations } = record; const address = locations[0]?.address || client.address || 'Sin ubicación'; return <li key={client.id}>
      <button className="client-panel-card" type="button" onClick={() => setEditing(record)} aria-label={`Abrir ${client.name}`}>
        <span className={`client-panel-avatar ${avatarColors[index % avatarColors.length]}`}>{initials(client.name)}</span>
        <span className="client-panel-info"><strong>{client.name}</strong><small><MapPin aria-hidden="true"/>{address}</small></span>
        <ChevronRight className="client-panel-chevron" aria-hidden="true"/>
      </button>
    </li> })}</ul> : <EmptyState Icon={UserRound} title="Sin clientes" description="Agrega tu primer cliente para comenzar." action={<button className="button button--primary" type="button" onClick={() => setEditing('new')}>Agregar cliente</button>} />}
  </div>
}
