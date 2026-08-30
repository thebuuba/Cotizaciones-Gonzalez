import { useLiveQuery } from 'dexie-react-hooks'
import { BrowserRouter, Route, Routes, useNavigate, useSearchParams } from 'react-router-dom'
import { quotationRepository, businessProfileRepository, clientRepository } from './providers'
import { AppShell } from '../components/AppShell'
import { HomePage } from '../features/home/HomePage'
import { QuotationsPage } from '../features/quotations/QuotationsPage'
import { ClientsPage } from '../features/clients/ClientsPage'
import { SettingsPage } from '../features/settings/SettingsPage'
import { QuotationEditor } from '../features/quotations/QuotationEditor'
import { createDefaultBusinessProfile } from '../db/defaults'

function HomeRoute() {
  const quotations = useLiveQuery(() => quotationRepository.list(), [], [])
  const profile = useLiveQuery(() => businessProfileRepository.get())
  return <HomePage businessName={profile?.businessName || 'Acabados Modernos Gonzalez'} quotations={quotations} syncState="synced" />
}

function NewQuotationRoute() {
  const clients = useLiveQuery(() => clientRepository.list(), [], [])
  const profile = useLiveQuery(() => businessProfileRepository.get())
  const [params] = useSearchParams()
  return <QuotationEditor
    business={profile ?? createDefaultBusinessProfile('business-default')}
    clients={clients}
    initialClientId={params.get('cliente') ?? undefined}
    initialLocationId={params.get('ubicacion') ?? undefined}
    onSave={(snapshot) => quotationRepository.save(snapshot)}
  />
}

function ClientsRoute() {
  const clients = useLiveQuery(() => clientRepository.list(), [], [])
  const navigate = useNavigate()
  return <ClientsPage clients={clients} onSave={(record) => clientRepository.save(record)} onStartQuotation={(clientId, locationId) => navigate(`/cotizaciones/nueva?cliente=${clientId}&ubicacion=${locationId}`)} />
}

export function App() {
  return <BrowserRouter><Routes><Route element={<AppShell/>}><Route index element={<HomeRoute/>}/><Route path="cotizaciones" element={<QuotationsPage/>}/><Route path="cotizaciones/nueva" element={<NewQuotationRoute/>}/><Route path="clientes/*" element={<ClientsRoute/>}/><Route path="ajustes" element={<SettingsPage/>}/></Route></Routes></BrowserRouter>
}
