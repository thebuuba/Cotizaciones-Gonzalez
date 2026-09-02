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

  return <div className="settings-page settings-ios">
    <PageHeader title="Ajustes" subtitle="Configura la aplicación y los datos de tu negocio" />

    <section className="settings-ios-section" aria-labelledby="settings-app-title">
      <h2 id="settings-app-title">Aplicación</h2>
      <div className="settings-ios-group">
        <PwaInstallCard />
        <div className="settings-ios-row settings-ios-row--sync">
          <span className="settings-ios-icon"><Cloud aria-hidden="true" /></span>
          <span className="settings-ios-copy">
            <strong>Respaldo en la nube</strong>
            <small>Protege y sincroniza tus datos.</small>
          </span>
          <span className="settings-ios-status"><SyncBadge state={sync.state} /></span>
          <button className="settings-ios-action" type="button" onClick={() => void sync.syncNow()} aria-label="Sincronizar ahora">
            <RefreshCw aria-hidden="true" />
          </button>
        </div>
      </div>
      <p className="settings-ios-help">La aplicación guarda los cambios localmente y los respalda cuando hay conexión.</p>
    </section>

    <BusinessProfileForm key={storedProfile?.updatedAt ?? 'default'} initialValue={profile} onSave={save} />

    {sync.signOut && <section className="settings-ios-section settings-ios-session" aria-labelledby="settings-session-title">
      <h2 id="settings-session-title">Sesión</h2>
      <div className="settings-ios-group">
        <button className="settings-ios-logout" type="button" onClick={() => {
          if (window.confirm('¿Seguro que deseas cerrar sesión?')) void sync.signOut?.()
        }}>
          <LogOut aria-hidden="true" />Cerrar sesión
        </button>
      </div>
    </section>}
  </div>
}
