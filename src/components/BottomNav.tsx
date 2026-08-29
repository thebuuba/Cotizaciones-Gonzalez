import { FileText, Home, Settings, Users } from 'lucide-react'
import { NavLink } from 'react-router-dom'

const destinations = [{ label: 'Inicio', to: '/', Icon: Home }, { label: 'Cotizaciones', to: '/cotizaciones', Icon: FileText }, { label: 'Clientes', to: '/clientes', Icon: Users }, { label: 'Ajustes', to: '/ajustes', Icon: Settings }]
export function BottomNav() {
  return <nav className="bottom-nav" aria-label="Navegación principal">{destinations.map(({ label, to, Icon }) => <NavLink end={to === '/'} className={({ isActive }) => `bottom-nav__item${isActive ? ' is-active' : ''}`} to={to} key={to}><Icon aria-hidden="true"/><span>{label}</span></NavLink>)}</nav>
}
