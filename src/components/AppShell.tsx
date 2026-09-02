import { Suspense } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { BottomNav } from './BottomNav'

export function AppShell() {
  const location = useLocation()
  const routeKey = `${location.pathname}${location.search}`

  return <div className="app-frame"><a className="skip-link" href="#main-content">Saltar al contenido</a><main id="main-content" className="app-content" tabIndex={-1}><Suspense fallback={<p className="loading-state" role="status">Cargando pantalla…</p>}><div className="route-transition" key={routeKey}><Outlet/></div></Suspense></main><BottomNav/></div>
}
