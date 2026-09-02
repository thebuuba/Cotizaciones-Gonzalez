import { useDeferredValue, useMemo, useState } from 'react'
import { MapPin, Pencil, Plus, Search, UserRound } from 'lucide-react'
import { PageHeader } from '../../components/PageHeader'
import { EmptyState } from '../../components/EmptyState'
import type { ClientRecord } from '../../db/repositories'
import { ClientForm } from './ClientForm'

export function ClientsPage({ clients, onSave, onStartQuotation }: { clients: ClientRecord[]; onSave: (record: ClientRecord) => void | Promise<void>; onStartQuotation: (clientId: string, locationId?: string) => void }) {
  const [search, setSearch] = useState('')
  const [editing, setEditing] = useState<ClientRecord | 'new' | null>(null)
  const deferred = useDeferredValue(search)
  const filtered = useMemo(() => clients.filter(({ client }) => client.name.toLocaleLowerCase('es').includes(deferred.trim().toLocaleLowerCase('es'))), [clients, deferred])
  if (editing) return <ClientForm initialValue={editing === 'new' ? undefined : editing} onCancel={() => setEditing(null)} onSave={async (record) => { await onSave(record); setEditing(null) }}/>
  return <div className="clients-page">
    <PageHeader title="Clientes" subtitle="Contactos y ubicaciones"/>
    <div className="search-field">
      <Search aria-hidden="true"/>
      <input type="search" aria-label="Buscar clientes" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar"/>
    </div>
    {filtered.length ? <ul className="client-list" aria-label="Lista de clientes">{filtered.map((record) => { const { client, locations } = record; return <li className="client-card" key={client.id}>
      <div className="client-card__header">
        <span className="client-card__avatar"><UserRound aria-hidden="true"/></span>
        <div className="client-card__info">
          <h2>{client.name}</h2>
          <p>{client.phone || client.email || ''}</p>
        </div>
        <button className="icon-button" type="button" onClick={() => setEditing(record)} aria-label={`Editar ${client.name}`}><Pencil aria-hidden="true"/></button>
      </div>
      {locations.length ? <div className="client-card__locations">{locations.map((place) => <div className="client-card__location" key={place.id}>
        <span><MapPin aria-hidden="true"/>{place.label} · {place.address}</span>
        <button className="button button--primary" type="button" onClick={() => onStartQuotation(client.id, place.id)} aria-label={`Cotizar en ${place.label} para ${client.name}`}>Cotizar</button>
      </div>)}</div> : <div className="client-card__locations"><div className="client-card__location">
        <span><MapPin aria-hidden="true"/>{client.address}</span>
        <button className="button button--primary" type="button" onClick={() => onStartQuotation(client.id)} aria-label={`Cotizar para ${client.name}`}>Cotizar</button>
      </div></div>}
    </li> })}</ul> : <EmptyState Icon={UserRound} title="Sin clientes" description="Agrega tu primer cliente para comenzar." action={<button className="button button--primary" type="button" onClick={() => setEditing('new')}>Agregar cliente</button>} />}
    <button className="fab" type="button" onClick={() => setEditing('new')} aria-label="Nuevo cliente"><Plus aria-hidden="true"/></button>
  </div>
}
