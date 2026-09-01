import { useDeferredValue, useMemo, useState } from 'react'
import { MapPin, Pencil, Plus, Search, UserRound } from 'lucide-react'
import { PageHeader } from '../../components/PageHeader'
import type { ClientRecord } from '../../db/repositories'
import { ClientForm } from './ClientForm'

export function ClientsPage({ clients, onSave, onStartQuotation }: { clients: ClientRecord[]; onSave: (record: ClientRecord) => void | Promise<void>; onStartQuotation: (clientId: string, locationId?: string) => void }) {
  const [search, setSearch] = useState('')
  const [editing, setEditing] = useState<ClientRecord | 'new' | null>(null)
  const deferred = useDeferredValue(search)
  const filtered = useMemo(() => clients.filter(({ client }) => client.name.toLocaleLowerCase('es').includes(deferred.trim().toLocaleLowerCase('es'))), [clients, deferred])
  if (editing) return <ClientForm initialValue={editing === 'new' ? undefined : editing} onCancel={() => setEditing(null)} onSave={async (record) => { await onSave(record); setEditing(null) }}/>
  return <div className="clients-page"><PageHeader title="Clientes" subtitle="Contactos y ubicaciones de trabajo"/><div className="page-actions"><label className="search-field"><Search aria-hidden="true"/><span className="sr-only">Buscar clientes</span><input type="search" aria-label="Buscar clientes" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar cliente"/></label><button className="icon-button icon-button--primary" type="button" onClick={() => setEditing('new')} aria-label="Nuevo cliente"><Plus aria-hidden="true"/></button></div>
    <section className="client-list" aria-label="Lista de clientes">{filtered.length ? filtered.map((record) => { const { client, locations } = record; return <article className="client-card" key={client.id}><div className="client-card__identity"><span><UserRound aria-hidden="true"/></span><div><h2>{client.name}</h2><p>{client.phone || client.email || 'Sin contacto adicional'}</p></div><button className="icon-button client-card__edit" type="button" onClick={() => setEditing(record)} aria-label={`Editar ${client.name}`}><Pencil aria-hidden="true"/></button></div>{locations.length ? locations.map((place) => <div className="location-row" key={place.id}><span><MapPin aria-hidden="true"/>{place.label} · {place.address}</span><button type="button" onClick={() => onStartQuotation(client.id, place.id)} aria-label={`Cotizar en ${place.label} para ${client.name}`}>Cotizar</button></div>) : <div className="location-row"><span><MapPin aria-hidden="true"/>{client.address}</span><button type="button" onClick={() => onStartQuotation(client.id)} aria-label={`Cotizar para ${client.name}`}>Cotizar</button></div>}</article> }) : <div className="empty-state"><UserRound aria-hidden="true"/><h2>No hay clientes</h2><p>Agrega tu primer cliente para comenzar.</p></div>}</section>
  </div>
}
