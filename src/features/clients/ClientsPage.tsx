import { useDeferredValue, useMemo, useRef, useState, type MouseEvent as ReactMouseEvent, type PointerEvent as ReactPointerEvent } from 'react'
import { ChevronRight, MapPin, Pencil, Plus, Search, Trash2, UserRound } from 'lucide-react'
import { PageHeader } from '../../components/PageHeader'
import { EmptyState } from '../../components/EmptyState'
import type { ClientRecord } from '../../db/repositories'
import { ClientForm } from './ClientForm'

const avatarColors = ['client-avatar--blue', 'client-avatar--pink', 'client-avatar--green', 'client-avatar--purple', 'client-avatar--orange']
const SWIPE_ACTIONS_WIDTH = 168
const SWIPE_THRESHOLD = 58

type ClientDetailTarget = string | 'new' | null

function initials(name: string): string {
  return name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase() ?? '').join('') || 'C'
}

function SwipeableClientRow({ record, index, revealed, onReveal, onOpen, onDelete }: {
  record: ClientRecord
  index: number
  revealed: boolean
  onReveal: (clientId: string | null) => void
  onOpen: (record: ClientRecord) => void
  onDelete: (record: ClientRecord) => void | Promise<void>
}) {
  const { client, locations } = record
  const address = locations[0]?.address || client.address || 'Sin ubicación'
  const [dragOffset, setDragOffset] = useState<number | null>(null)
  const pointer = useRef({ x: 0, y: 0, startOffset: 0, moved: false, horizontal: false })

  const offset = dragOffset ?? (revealed ? -SWIPE_ACTIONS_WIDTH : 0)
  const revealedWidth = Math.max(0, Math.min(SWIPE_ACTIONS_WIDTH, -offset))
  const revealProgress = revealedWidth / SWIPE_ACTIONS_WIDTH
  const actionParallax = Math.round((1 - revealProgress) * 38)
  const dragging = dragOffset !== null

  const handlePointerDown = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return
    pointer.current = {
      x: event.clientX,
      y: event.clientY,
      startOffset: revealed ? -SWIPE_ACTIONS_WIDTH : 0,
      moved: false,
      horizontal: false,
    }
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  const handlePointerMove = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (!event.currentTarget.hasPointerCapture(event.pointerId)) return
    const dx = event.clientX - pointer.current.x
    const dy = event.clientY - pointer.current.y

    if (!pointer.current.horizontal) {
      if (Math.abs(dx) < 6 && Math.abs(dy) < 6) return
      if (Math.abs(dy) > Math.abs(dx)) return
      pointer.current.horizontal = true
    }

    pointer.current.moved = true
    const next = Math.max(-SWIPE_ACTIONS_WIDTH, Math.min(0, pointer.current.startOffset + dx))
    setDragOffset(next)
  }

  const finishSwipe = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId)
    const current = dragOffset ?? pointer.current.startOffset
    if (pointer.current.moved) onReveal(current <= -SWIPE_THRESHOLD ? client.id : null)
    setDragOffset(null)
  }

  const handleCardClick = (event: ReactMouseEvent<HTMLButtonElement>) => {
    if (pointer.current.moved) {
      event.preventDefault()
      pointer.current.moved = false
      return
    }
    if (revealed) {
      onReveal(null)
      return
    }
    onOpen(record)
  }

  const handleDelete = async () => {
    const confirmed = window.confirm(`¿Eliminar a ${client.name}?`)
    if (!confirmed) return
    onReveal(null)
    await onDelete(record)
  }

  return <li className={`client-swipe-row${revealed ? ' is-revealed' : ''}${dragging ? ' is-dragging' : ''}`}>
    <div
      className="client-swipe-actions"
      aria-hidden={revealedWidth === 0}
      style={{ width: `${revealedWidth}px`, opacity: revealProgress }}
    >
      <div className="client-swipe-actions__track" style={{ transform: `translate3d(${actionParallax}px, 0, 0)` }}>
        <button className="client-swipe-action client-swipe-action--edit" type="button" tabIndex={revealed ? 0 : -1} onClick={() => { onReveal(null); onOpen(record) }} aria-label={`Editar ${client.name}`}>
          <Pencil aria-hidden="true"/><span>Editar</span>
        </button>
        <button className="client-swipe-action client-swipe-action--delete" type="button" tabIndex={revealed ? 0 : -1} onClick={() => void handleDelete()} aria-label={`Eliminar ${client.name}`}>
          <Trash2 aria-hidden="true"/><span>Eliminar</span>
        </button>
      </div>
    </div>
    <button
      className={`client-panel-card client-swipe-front${dragging ? ' is-dragging' : ''}`}
      type="button"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={finishSwipe}
      onPointerCancel={finishSwipe}
      onClick={handleCardClick}
      style={{ transform: `translate3d(${offset}px, 0, 0)` }}
      aria-label={`Abrir ${client.name}`}
    >
      <span className={`client-panel-avatar ${avatarColors[index % avatarColors.length]}`}>{initials(client.name)}</span>
      <span className="client-panel-info"><strong>{client.name}</strong><small><MapPin aria-hidden="true"/>{address}</small></span>
      <ChevronRight className="client-panel-chevron" aria-hidden="true"/>
    </button>
  </li>
}

export function ClientsPage({ clients, loading = false, onSave, onDelete, detailTarget, onOpenClient, onCloseClient }: {
  clients: ClientRecord[]
  loading?: boolean
  onSave: (record: ClientRecord) => void | Promise<void>
  onDelete: (record: ClientRecord) => void | Promise<void>
  onStartQuotation: (clientId: string, locationId?: string) => void
  detailTarget?: ClientDetailTarget
  onOpenClient?: (target: Exclude<ClientDetailTarget, null>) => void
  onCloseClient?: () => void
}) {
  const [search, setSearch] = useState('')
  const [localEditing, setLocalEditing] = useState<ClientRecord | 'new' | null>(null)
  const [transitionDirection, setTransitionDirection] = useState<'none' | 'forward' | 'back'>('none')
  const [revealedClientId, setRevealedClientId] = useState<string | null>(null)
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
    setRevealedClientId(null)
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

  return <div className={`clients-page clients-panel ${transitionClass}`} onPointerDown={(event) => {
    if (event.target === event.currentTarget) setRevealedClientId(null)
  }}>
    <PageHeader title="Clientes" subtitle="Contactos y ubicaciones"/>
    <div className="clients-toolbar">
      <label className="clients-search">
        <Search aria-hidden="true"/>
        <span className="sr-only">Buscar clientes</span>
        <input type="search" aria-label="Buscar clientes" value={search} onChange={(event) => { setSearch(event.target.value); setRevealedClientId(null) }} placeholder="Buscar" disabled={loading}/>
      </label>
      <button className="clients-add" type="button" onClick={() => openClient('new')} aria-label="Nuevo cliente" disabled={loading}><Plus aria-hidden="true"/></button>
    </div>
    {loading ? <p className="loading-state" role="status" aria-live="polite">Cargando clientes…</p> : filtered.length ? <ul className="client-list client-panel-list" aria-label="Lista de clientes">{filtered.map((record, index) => <SwipeableClientRow
      key={record.client.id}
      record={record}
      index={index}
      revealed={revealedClientId === record.client.id}
      onReveal={setRevealedClientId}
      onOpen={openClient}
      onDelete={onDelete}
    />)}</ul> : <EmptyState Icon={UserRound} title="Sin clientes" description="Agrega tu primer cliente para comenzar." action={<button className="button button--primary" type="button" onClick={() => openClient('new')}>Agregar cliente</button>} />}
  </div>
}
