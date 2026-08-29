import { FileText, Home, Plus, Settings, Users } from 'lucide-react'

const destinations = [
  { label: 'Inicio', href: '/', Icon: Home },
  { label: 'Cotizaciones', href: '/cotizaciones', Icon: FileText },
  { label: 'Clientes', href: '/clientes', Icon: Users },
  { label: 'Ajustes', href: '/ajustes', Icon: Settings },
]

export function App() {
  return (
    <div className="app-frame">
      <header className="top-bar">
        <h1>Cotizaciones</h1>
      </header>

      <main className="app-content">
        <section className="empty-state" aria-labelledby="welcome-title">
          <span className="empty-state__icon" aria-hidden="true"><FileText /></span>
          <h2 id="welcome-title">Tu trabajo, bien cotizado</h2>
          <p>Crea presupuestos claros, guárdalos y compártelos en PDF.</p>
        </section>
      </main>

      <a className="fab" href="/cotizaciones/nueva" aria-label="Nueva cotización">
        <Plus aria-hidden="true" />
      </a>

      <nav className="bottom-nav" aria-label="Navegación principal">
        {destinations.map(({ label, href, Icon }, index) => (
          <a className={index === 0 ? 'bottom-nav__item is-active' : 'bottom-nav__item'} href={href} key={label}>
            <Icon aria-hidden="true" />
            <span>{label}</span>
          </a>
        ))}
      </nav>
    </div>
  )
}
