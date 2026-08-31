import { Outlet, useLocation } from 'react-router-dom'
import { BottomNav } from './BottomNav'
import { Fab } from './Fab'

export function AppShell() {
  const location = useLocation()
  const showFab = !location.pathname.startsWith('/cotizaciones/')
  return <div className="app-frame"><main className="app-content"><Outlet/></main>{showFab && <Fab/>}<BottomNav/></div>
}
