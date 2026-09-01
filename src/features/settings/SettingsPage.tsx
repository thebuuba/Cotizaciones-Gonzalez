import { useLiveQuery } from 'dexie-react-hooks'
import { Cloud, LogOut, RefreshCw } from 'lucide-react'

import { businessProfileRepository, useSync } from '../../app/providers'
import { SyncBadge } from '../../components/SyncBadge'
import { PageHeader } from '../../components/PageHeader'
import { createDefaultBusinessProfile } from '../../db/defaults'
import { BusinessProfileForm, type BusinessProfileFormValue } from '../business/BusinessProfileForm'
import { PwaInstallCard } from '../../pwa/PwaInstallCard'

export function SettingsPage() {
  const storedProfile = useLiveQuery(() => businessProfileRepository.get())
  const sync = useSync()
  const profile = storedProfile ?? createDefaultBusinessProfile('business-default', new Date().toISOString())
  const save = async (value: BusinessProfileFormValue) => businessProfileRepository.save({
    id: profile.id,
    ...value,
    updatedAt: new Date().toISOString(),
  })
  return <div className="settings-page">
    <PageHeader title="Ajustes" subtitle="Aplicación, respaldo y datos del negocio" />
    <section className="settings-section" aria-labelledby="settings-app-title"><h2 id="settings-app-title" className="section-label">Aplicación</h2><div className="settings-group">
    <PwaInstallCard />
    <section className="settings-row"><div><Cloud aria-hidden="true" /><span><strong>Respaldo en la nube</strong><SyncBadge state={sync.state} /></span></div><div className="settings-actions"><button className="button button--quiet" type="button" onClick={() => void sync.syncNow()}><RefreshCw aria-hidden="true" />Sincronizar</button>{sync.signOut && <button className="icon-button icon-button--danger" type="button" aria-label="Cerrar sesión" onClick={() => void sync.signOut?.()}><LogOut aria-hidden="true" /></button>}</div></section>
    </div></section>
    <BusinessProfileForm key={storedProfile?.updatedAt ?? 'default'} initialValue={profile} onSave={save} />
  </div>
}
