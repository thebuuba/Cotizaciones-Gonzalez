import { useEffect, useRef } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { BottomNav } from './BottomNav'

function routeDepth(pathname: string): number {
  if (pathname === '/' || pathname === '/cotizaciones' || pathname === '/clientes' || pathname === '/ajustes') return 0
  if (pathname === '/cotizaciones/nueva') return 1
  if (/^\/cotizaciones\/[^/]+\/editar$/.test(pathname)) return 2
  if (/^\/cotizaciones\/[^/]+$/.test(pathname)) return 1
  return pathname.split('/').filter(Boolean).length
}

function isTabRoute(pathname: string): boolean {
  return pathname === '/' || pathname === '/cotizaciones' || pathname === '/clientes' || pathname === '/ajustes'
}

export function AppShell() {
  const location = useLocation()
  const previousPathRef = useRef<string | null>(null)
  const previousPath = previousPathRef.current
  const primaryTab = isTabRoute(location.pathname)
  const routeKey = primaryTab ? 'primary-tabs' : `${location.pathname}${location.search}`

  let direction: 'initial' | 'forward' | 'back' | 'tab' = 'initial'
  if (previousPath) {
    if (isTabRoute(previousPath) && primaryTab) direction = 'tab'
    else direction = routeDepth(location.pathname) < routeDepth(previousPath) ? 'back' : 'forward'
  }

  useEffect(() => {
    previousPathRef.current = location.pathname
  }, [location.pathname])

  return <div className="app-frame">
    <a className="skip-link" href="#main-content">Saltar al contenido</a>
    <main id="main-content" className="app-content" tabIndex={-1}>
      <div className={`route-transition route-transition--${direction}`} key={routeKey}><Outlet /></div>
    </main>
    <BottomNav />
  </div>
}
