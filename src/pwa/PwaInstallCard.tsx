import { Download, Share2, Smartphone } from 'lucide-react'

import { usePwaInstall } from './PwaInstallProvider'

export function PwaInstallCard() {
  const { install, mode } = usePwaInstall()
  if (mode === 'installed' || mode === 'unavailable') return null

  if (mode === 'ios') return <div className="settings-ios-row settings-ios-install">
    <span className="settings-ios-icon"><Smartphone aria-hidden="true" /></span>
    <span className="settings-ios-copy">
      <strong>Instalar aplicación</strong>
      <small>En Safari toca <b><Share2 aria-hidden="true" />Compartir</b> y luego “Añadir a pantalla de inicio”.</small>
    </span>
  </div>

  return <div className="settings-ios-row settings-ios-install">
    <span className="settings-ios-icon"><Download aria-hidden="true" /></span>
    <span className="settings-ios-copy">
      <strong>Instalar aplicación</strong>
      <small>Acceso rápido desde tu pantalla de inicio.</small>
    </span>
    <button className="settings-ios-text-button" type="button" onClick={() => void install()}>Instalar</button>
  </div>
}
