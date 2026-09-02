import { useLiveQuery } from 'dexie-react-hooks'
import { Cloud, LogOut, RefreshCw, Settings2 } from 'lucide-react'

import { businessProfileRepository, useSync } from '../../app/providers'
import { PageHeader } from '../../components/PageHeader'
import { SyncBadge } from '../../components/SyncBadge'
import { createDefaultBusinessProfile } from '../../db/defaults'
import { PwaInstallCard } from '../../pwa/PwaInstallCard'
import { BusinessProfileForm, type BusinessProfileFormValue } from '../business/BusinessProfileForm'

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
    <section className="settings-section" aria-labelledby="settings-app-title">
      <div className="settings-section__header">
        <span className="settings-section__icon"><Settings2 aria-hidden="true" /></span>
        <div><h2 id="settings-app-title">Aplicación</h2><p>Instalación y respaldo de tu información.</p></div>
      </div>
      <div className="settings-group">
        <PwaInstallCard />
        <div className="settings-row">
          <div className="settings-row__content">
            <span className="settings-row__icon"><Cloud aria-hidden="true" /></span>
            <span><strong>Respaldo en la nube</strong><SyncBadge state={sync.state} /></span>
          </div>
          <div className="settings-actions">
            <button className="button button--quiet" type="button" onClick={() => void sync.syncNow()}>
              <RefreshCw aria-hidden="true" />Sincronizar
            </button>
            {sync.signOut && <button className="icon-button icon-button--danger" type="button" aria-label="Cerrar sesión" onClick={() => void sync.signOut?.()}><LogOut aria-hidden="true" /></button>}
          </div>
        </div>
      </div>
    </section>
    <BusinessProfileForm key={storedProfile?.updatedAt ?? 'default'} initialValue={profile} onSave={save} />
  </div>
}
