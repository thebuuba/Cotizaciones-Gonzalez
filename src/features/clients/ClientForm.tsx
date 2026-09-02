import { useState, type FormEvent } from 'react'
import { ChevronLeft, MapPin, Plus, Save, Trash2, UserRound } from 'lucide-react'
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
  const [isDirty, setIsDirty] = useState(!initialValue)

  const input = (name: keyof Omit<ClientDraft, 'locations'>) => ({
    value: value[name],
    onChange: (event: React.ChangeEvent<HTMLInputElement>) => {
      setValue((current) => ({ ...current, [name]: event.target.value }))
      setIsDirty(true)
    },
  })

  const setLocation = (index: number, name: 'label' | 'address', text: string) => {
    setValue((current) => ({ ...current, locations: current.locations.map((item, itemIndex) => itemIndex === index ? { ...item, [name]: text } : item) }))
    setIsDirty(true)
  }

  const addLocation = () => {
    setValue((current) => ({ ...current, locations: [...current.locations, { ...emptyLocation }] }))
    setIsDirty(true)
  }

  const removeLocation = (index: number) => {
    setValue((current) => {
      const remaining = current.locations.filter((_, itemIndex) => itemIndex !== index)
      return { ...current, locations: remaining.length ? remaining : [{ ...emptyLocation }] }
    })
    setIsDirty(true)
  }

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

  return <form className="client-detail-form client-detail-reference" onSubmit={submit} noValidate>
    <nav className="client-detail-nav" aria-label="Navegación del cliente">
      <button className="client-detail-nav-back" type="button" onClick={onCancel}><ChevronLeft aria-hidden="true" />Clientes</button>
      <strong>{initialValue ? 'Cliente' : 'Nuevo cliente'}</strong>
      <span aria-hidden="true" />
    </nav>

    <header className="client-detail-profile">
      <span className="client-detail-profile-avatar">{initialValue ? initials(value.name) : <UserRound aria-hidden="true" />}</span>
      <h1>{initialValue ? value.name || 'Cliente' : 'Nuevo cliente'}</h1>
      <p>Contacto y ubicaciones de proyectos</p>
    </header>

    <FormErrorSummary errors={errors} />

    <section className="client-detail-group" aria-labelledby="client-contact-title">
      <h2 id="client-contact-title">Datos del cliente</h2>
      <div className="client-detail-card client-detail-contact-card">
        <label className="client-detail-row" htmlFor="client-name"><span>Nombre</span><input id="client-name" aria-label="Nombre del cliente" {...input('name')} aria-invalid={Boolean(errors.name)} aria-describedby={errors.name ? 'client-name-error' : undefined}/></label>
        {errors.name && <span id="client-name-error" className="field-error client-detail-inline-error">{errors.name}</span>}
        <label className="client-detail-row"><span>Teléfono</span><input type="tel" aria-label="Teléfono" placeholder="Ej. 8888 8888" {...input('phone')}/></label>
        <label className="client-detail-row" htmlFor="client-email"><span>Correo</span><input id="client-email" type="email" aria-label="Correo electrónico" placeholder="correo@ejemplo.com" {...input('email')} aria-invalid={Boolean(errors.email)} aria-describedby={errors.email ? 'client-email-error' : undefined}/></label>
        {errors.email && <span id="client-email-error" className="field-error client-detail-inline-error">{errors.email}</span>}
        <label className="client-detail-row"><span>Dirección</span><input aria-label="Dirección de contacto" {...input('address')}/></label>
      </div>
      <p className="client-detail-help">Información de contacto principal del cliente.</p>
    </section>

    <section className="client-detail-group" aria-labelledby="client-locations-title">
      <div className="client-detail-group-heading">
        <h2 id="client-locations-title">Ubicaciones de proyectos</h2>
        <button className="client-detail-text-action" type="button" onClick={addLocation} aria-label="Agregar otra ubicación"><Plus aria-hidden="true" />Agregar</button>
      </div>

      <div className="client-location-list-reference">
        {value.locations.map((item, index) => <div className="client-detail-card client-location-card-reference" key={index}>
          <div className="client-location-card-header">
            <span><MapPin aria-hidden="true" />Ubicación {index + 1}</span>
            <button type="button" onClick={() => removeLocation(index)} aria-label={`Eliminar ubicación ${index + 1}`}><Trash2 aria-hidden="true" /></button>
          </div>
          <label className="client-detail-row"><span>Nombre</span><input aria-label={`Nombre de ubicación ${index + 1}`} value={item.label} onChange={(event) => setLocation(index, 'label', event.target.value)} placeholder="Ej. Casa principal" /></label>
          <label className="client-detail-row"><span>Dirección</span><input aria-label={`Dirección de ubicación ${index + 1}`} value={item.address} onChange={(event) => setLocation(index, 'address', event.target.value)} placeholder="Dirección" /></label>
        </div>)}
      </div>
      <p className="client-detail-help">Lugares donde se realizan los proyectos de este cliente.</p>
    </section>

    {isDirty && <footer className="client-detail-dirty-actions">
      <button className="button button--primary client-detail-save" type="submit"><Save aria-hidden="true" />Guardar cliente</button>
    </footer>}
  </form>
}
