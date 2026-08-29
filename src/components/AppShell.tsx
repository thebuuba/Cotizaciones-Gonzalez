import { Outlet, useLocation } from 'react-router-dom'
import { BottomNav } from './BottomNav'
import { Fab } from './Fab'

const title = (path: string) => path.startsWith('/cotizaciones') ? 'Cotizaciones' : path.startsWith('/clientes') ? 'Clientes' : path.startsWith('/ajustes') ? 'Ajustes' : 'Inicio'
export function AppShell() {
  const location = useLocation()
  return <div className="app-frame"><header className="top-bar"><h1>{title(location.pathname)}</h1></header><main className="app-content"><Outlet/></main><Fab/><BottomNav/></div>
}
