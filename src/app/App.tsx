import { lazy } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { BrowserRouter, Route, Routes, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { quotationRepository, businessProfileRepository, clientRepository } from './providers'
import { AppShell } from '../components/AppShell'
import { HomePage } from '../features/home/HomePage'
import { createDefaultBusinessProfile } from '../db/defaults'

const QuotationsPage = lazy(() => import('../features/quotations/QuotationsPage').then((module) => ({ default: module.QuotationsPage })))
const ClientsPage = lazy(() => import('../features/clients/ClientsPage').then((module) => ({ default: module.ClientsPage })))
const SettingsPage = lazy(() => import('../features/settings/SettingsPage').then((module) => ({ default: module.SettingsPage })))
const QuotationEditor = lazy(() => import('../features/quotations/QuotationEditor').then((module) => ({ default: module.QuotationEditor })))
const QuotationDetailPage = lazy(() => import('../features/quotations/QuotationDetailPage').then((module) => ({ default: module.QuotationDetailPage })))

function HomeRoute() {
  const quotations = useLiveQuery(() => quotationRepository.list(), [], [])
  const profile = useLiveQuery(() => businessProfileRepository.get())
  return <HomePage businessName={profile?.businessName || 'Acabados Modernos Gonzalez'} quotations={quotations} />
}

function NewQuotationRoute() {
  const clients = useLiveQuery(() => clientRepository.list(), [], [])
  const profile = useLiveQuery(() => businessProfileRepository.get())
  const [params] = useSearchParams()
  const navigate = useNavigate()
  return <QuotationEditor
    business={profile ?? createDefaultBusinessProfile('business-default')}
    clients={clients}
    initialClientId={params.get('cliente') ?? undefined}
    initialLocationId={params.get('ubicacion') ?? undefined}
    onSave={async (snapshot) => { await quotationRepository.save(snapshot); navigate('/cotizaciones', { replace: true }) }}
  />
}

function QuotationsRoute() {
  const quotations = useLiveQuery(() => quotationRepository.list(), [], [])
  return <QuotationsPage quotations={quotations} />
}

function EditQuotationRoute() {
  const { id } = useParams()
  const snapshot = useLiveQuery(() => id ? quotationRepository.get(id) : undefined, [id])
  const clients = useLiveQuery(() => clientRepository.list(), [], [])
  if (!snapshot) return <p className="loading-state">Cargando cotización…</p>
  return <QuotationEditor business={snapshot.business} clients={clients} initialValue={snapshot} onSave={(value) => quotationRepository.save(value)} />
}

function QuotationDetailRoute() {
  const { id } = useParams()
  const navigate = useNavigate()
  const snapshot = useLiveQuery(() => id ? quotationRepository.get(id) : undefined, [id])
  if (!snapshot) return <p className="loading-state">Cargando cotización…</p>
  return <QuotationDetailPage snapshot={snapshot} onStatusChange={(status) => quotationRepository.save({ ...snapshot, quotation: { ...snapshot.quotation, status, updatedAt: new Date().toISOString() } })} onDelete={async () => { await quotationRepository.softDelete(snapshot.quotation.id, new Date()); navigate('/cotizaciones', { replace: true }) }} />
}

function ClientsRoute() {
  const clients = useLiveQuery(() => clientRepository.list(), [], [])
  const navigate = useNavigate()
  return <ClientsPage clients={clients} onSave={(record) => clientRepository.save(record)} onStartQuotation={(clientId, locationId) => navigate(`/cotizaciones/nueva?cliente=${clientId}${locationId ? `&ubicacion=${locationId}` : ''}`)} />
}

export function App() {
  return <BrowserRouter><Routes><Route element={<AppShell/>}><Route index element={<HomeRoute/>}/><Route path="cotizaciones" element={<QuotationsRoute/>}/><Route path="cotizaciones/nueva" element={<NewQuotationRoute/>}/><Route path="cotizaciones/:id" element={<QuotationDetailRoute/>}/><Route path="cotizaciones/:id/editar" element={<EditQuotationRoute/>}/><Route path="clientes/*" element={<ClientsRoute/>}/><Route path="ajustes" element={<SettingsPage/>}/></Route></Routes></BrowserRouter>
}
