import { useLiveQuery } from 'dexie-react-hooks'
import { Moon, Sun } from 'lucide-react'
import { useState } from 'react'

import { businessProfileRepository } from '../../app/providers'
import { createDefaultBusinessProfile } from '../../db/defaults'
import { BusinessProfileForm, type BusinessProfileFormValue } from '../business/BusinessProfileForm'

export function SettingsPage() {
  const storedProfile = useLiveQuery(() => businessProfileRepository.get())
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
    <BusinessProfileForm key={storedProfile?.updatedAt ?? 'default'} initialValue={profile} onSave={save} />
  </div>
}
