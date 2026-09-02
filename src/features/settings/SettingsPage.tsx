import { useLiveQuery } from 'dexie-react-hooks'
import { Cloud, LogOut, RefreshCw } from 'lucide-react'

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
    <PageHeader title="Ajustes" subtitle="Respaldo y datos del negocio" />
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
        </div>
      </div>
    </div>
    <BusinessProfileForm key={storedProfile?.updatedAt ?? 'default'} initialValue={profile} onSave={save} />
    {sync.signOut && <button className="button button--quiet" type="button" style={{ width: '100%', justifyContent: 'center', gap: '.45rem', color: 'var(--color-danger)' }} onClick={() => { if (window.confirm('¿Seguro que deseas cerrar sesión?')) { void sync.signOut?.() } }}><LogOut aria-hidden="true" />Cerrar sesión</button>}
  </div>
}
