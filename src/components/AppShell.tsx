import { Outlet, useLocation } from 'react-router-dom'
import { BottomNav } from './BottomNav'

export function AppShell() {
  const location = useLocation()
  const routeKey = `${location.pathname}${location.search}`

  return <div className="app-frame"><main className="app-content"><div className="route-transition" key={routeKey}><Outlet/></div></main><BottomNav/></div>
}
