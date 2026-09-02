import { useState, type FormEvent } from 'react'
import { ArrowLeft, MapPin, Plus, Save, UserRound } from 'lucide-react'
import type { ClientRecord } from '../../db/repositories'
import { FormErrorSummary } from '../../components/FormErrorSummary'
import { clientSchema, type ClientDraft } from './clientSchema'

const emptyLocation = { label: '', address: '' }
const empty: ClientDraft = { name: '', phone: '', email: '', address: '', locations: [emptyLocation] }

function initials(name: string): string {
  return name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase() ?? '').join('') || 'C'
}

export function ClientForm({ initialValue, onSave, onCancel }: { initialValue?: ClientRecord; onSave: (value: ClientRecord) => void | Promise<void>; onCancel: () => void }) {
  const [value, setValue] = useState<ClientDraft>(initialValue ? {
    ...initialValue.client,
    locations: initialValue.locations.length ? initialValue.locations.map(({ label, address }) => ({ label, address })) : [emptyLocation],
  } : empty)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const input = (name: keyof Omit<ClientDraft, 'locations'>) => ({ value: value[name], onChange: (event: React.ChangeEvent<HTMLInputElement>) => setValue((current) => ({ ...current, [name]: event.target.value })) })
  const setLocation = (index: number, name: 'label' | 'address', text: string) => setValue((current) => ({ ...current, locations: current.locations.map((item, itemIndex) => itemIndex === index ? { ...item, [name]: text } : item) }))

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    const result = clientSchema.safeParse(value)
    if (!result.success) {
      setErrors(Object.fromEntries(result.error.issues.map((issue) => [String(issue.path[0]), issue.message])))
      return
    }

    setErrors({})
    const now = new Date().toISOString()
    const clientId = initialValue?.client.id ?? crypto.randomUUID()
    await onSave({
      client: { id: clientId, name: result.data.name, phone: result.data.phone, email: result.data.email, address: result.data.address, updatedAt: now },
      locations: result.data.locations.filter((item) => item.label || item.address).map((item, index) => ({ id: initialValue?.locations[index]?.id ?? crypto.randomUUID(), clientId, ...item, updatedAt: now })),
    })
  }

  return <form className="client-detail-form" onSubmit={submit} noValidate>
    <header className="client-detail-header client-detail-header--simple">
      <button className="client-detail-back" type="button" onClick={onCancel} aria-label="Volver a clientes"><ArrowLeft aria-hidden="true" /></button>
      <div className="client-detail-heading client-detail-heading--simple">
        <span className="client-detail-avatar">{initialValue ? initials(value.name) : <UserRound aria-hidden="true" />}</span>
        <div>
          <span>{initialValue ? 'Cliente' : 'Nuevo cliente'}</span>
          <h1>{initialValue ? value.name || 'Cliente' : 'Nuevo cliente'}</h1>
          <p>Contacto y ubicaciones de proyectos</p>
        </div>
      </div>
    </header>

    <FormErrorSummary errors={errors} />

    <section className="client-detail-section" aria-labelledby="client-contact-title">
      <div className="client-detail-section-heading"><span>Contacto</span><h2 id="client-contact-title">Datos del cliente</h2></div>
      <div className="client-detail-fields">
        <div className="form-field"><label htmlFor="client-name">Nombre del cliente</label><input id="client-name" {...input('name')} aria-invalid={Boolean(errors.name)} aria-describedby={errors.name ? 'client-name-error' : undefined}/>{errors.name && <span id="client-name-error" className="field-error">{errors.name}</span>}</div>
        <label>Teléfono<input type="tel" {...input('phone')}/></label>
        <div className="form-field"><label htmlFor="client-email">Correo electrónico</label><input id="client-email" type="email" {...input('email')} aria-invalid={Boolean(errors.email)} aria-describedby={errors.email ? 'client-email-error' : undefined}/>{errors.email && <span id="client-email-error" className="field-error">{errors.email}</span>}</div>
        <label>Dirección de contacto<input {...input('address')}/></label>
      </div>
    </section>

    <section className="client-detail-section" aria-labelledby="client-locations-title">
      <div className="client-detail-section-heading client-detail-section-heading--action">
        <div><span>Proyectos</span><h2 id="client-locations-title">Ubicaciones</h2></div>
        <button className="client-detail-add-location" type="button" onClick={() => setValue((current) => ({ ...current, locations: [...current.locations, { ...emptyLocation }] }))}><Plus aria-hidden="true" />Agregar</button>
      </div>
      <div className="client-location-list">
        {value.locations.map((item, index) => <div className="client-location-card" key={index}>
          <span className="client-location-icon"><MapPin aria-hidden="true" /></span>
          <div className="client-location-fields">
            <label>Nombre de ubicación {index + 1}<input value={item.label} onChange={(event) => setLocation(index, 'label', event.target.value)} placeholder="Ej. Casa principal" /></label>
            <label>Dirección de ubicación {index + 1}<input value={item.address} onChange={(event) => setLocation(index, 'address', event.target.value)} placeholder="Dirección" /></label>
          </div>
        </div>)}
      </div>
    </section>

    <footer className="client-detail-savebar client-detail-savebar--simple">
      <button className="button button--primary client-detail-save" type="submit"><Save aria-hidden="true" />Guardar cliente</button>
    </footer>
  </form>
}
