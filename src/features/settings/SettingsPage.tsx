import { useLiveQuery } from 'dexie-react-hooks'
import { Cloud, LogOut, Moon, RefreshCw, Sun } from 'lucide-react'
import { useState } from 'react'

import { businessProfileRepository, useSync } from '../../app/providers'
import { SyncBadge } from '../../components/SyncBadge'
import { createDefaultBusinessProfile } from '../../db/defaults'
import { BusinessProfileForm, type BusinessProfileFormValue } from '../business/BusinessProfileForm'

export function SettingsPage() {
  const storedProfile = useLiveQuery(() => businessProfileRepository.get())
  const sync = useSync()
  const [dark, setDark] = useState(() => document.documentElement.dataset.theme === 'dark')
  const profile = storedProfile ?? createDefaultBusinessProfile('business-default', new Date().toISOString())
  const save = async (value: BusinessProfileFormValue) => businessProfileRepository.save({
    id: profile.id,
    ...value,
    updatedAt: new Date().toISOString(),
  })
  const toggleTheme = () => {
    const next = !dark
    setDark(next)
    document.documentElement.dataset.theme = next ? 'dark' : 'light'
  }
  return <div className="settings-page">
    <section className="settings-row"><div>{dark ? <Moon aria-hidden="true" /> : <Sun aria-hidden="true" />}<span><strong>Apariencia</strong><small>{dark ? 'Oscura' : 'Clara'}</small></span></div><button className="button button--quiet" type="button" onClick={toggleTheme}>Cambiar</button></section>
    <section className="settings-row"><div><Cloud aria-hidden="true" /><span><strong>Respaldo en la nube</strong><SyncBadge state={sync.state} /></span></div><div className="settings-actions"><button className="button button--quiet" type="button" onClick={() => void sync.syncNow()}><RefreshCw aria-hidden="true" />Sincronizar</button>{sync.signOut && <button className="icon-button icon-button--danger" type="button" aria-label="Cerrar sesión" onClick={() => void sync.signOut?.()}><LogOut aria-hidden="true" /></button>}</div></section>
    <BusinessProfileForm key={storedProfile?.updatedAt ?? 'default'} initialValue={profile} onSave={save} />
  </div>
}
