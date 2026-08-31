import { Download, Share2, Smartphone } from 'lucide-react'

import { usePwaInstall } from './PwaInstallProvider'

export function PwaInstallCard() {
  const { install, mode } = usePwaInstall()
  if (mode === 'installed' || mode === 'unavailable') return null

  if (mode === 'ios') return <section className="settings-row install-card"><div><Smartphone aria-hidden="true"/><span><strong>Instalar aplicación</strong><small>En Safari toca <b><Share2 aria-hidden="true"/>Compartir</b> y luego <b>Añadir a pantalla de inicio</b>.</small></span></div></section>

  return <section className="settings-row install-card"><div><Download aria-hidden="true"/><span><strong>Instalar aplicación</strong><small>Acceso rápido desde tu pantalla de inicio.</small></span></div><button className="button button--primary" type="button" onClick={() => void install()}><Download aria-hidden="true"/>Instalar aplicación</button></section>
}
