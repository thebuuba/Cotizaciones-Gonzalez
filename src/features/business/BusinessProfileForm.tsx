import { useState, type ChangeEvent, type FormEvent } from 'react'

import { createDefaultBusinessProfile } from '../../db/defaults'
import { businessProfileSchema, type BusinessProfileDraft } from './businessProfileSchema'

const initialProfile = createDefaultBusinessProfile('default', new Date(0).toISOString())
const empty: BusinessProfileDraft = {
  businessName: initialProfile.businessName,
  tagline: initialProfile.tagline,
  headerPhone: initialProfile.headerPhone,
  terms: [...initialProfile.terms],
  bankAccounts: initialProfile.bankAccounts.map((account) => ({ ...account })),
  managerName: initialProfile.managerName,
  managerTitle: initialProfile.managerTitle,
  directPhone: initialProfile.directPhone,
  whatsappPhone: initialProfile.whatsappPhone,
  footerQuality: initialProfile.footerQuality,
  footerCommitment: initialProfile.footerCommitment,
  footerFaith: initialProfile.footerFaith,
}

export type BusinessProfileFormValue = BusinessProfileDraft & { logoBlob?: Blob; stampBlob?: Blob }

export function BusinessProfileForm({ initialValue = empty, onSave }: {
  initialValue?: BusinessProfileFormValue
  onSave: (value: BusinessProfileFormValue) => void | Promise<void>
}) {
  const [value, setValue] = useState<BusinessProfileDraft>(initialValue)
  const [logoBlob, setLogoBlob] = useState<Blob | undefined>(initialValue.logoBlob)
  const [stampBlob, setStampBlob] = useState<Blob | undefined>(initialValue.stampBlob)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const textField = (name: keyof BusinessProfileDraft) => ({
    value: String(value[name]),
    onChange: (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setValue((current) => ({ ...current, [name]: event.target.value }))
    },
  })
  const updateTerm = (index: number, term: string) => setValue((current) => ({
    ...current,
    terms: current.terms.map((item, itemIndex) => itemIndex === index ? term : item),
  }))
  const updateAccount = (index: number, field: 'bank' | 'type' | 'number', nextValue: string) => setValue((current) => ({
    ...current,
    bankAccounts: current.bankAccounts.map((account, accountIndex) => accountIndex === index ? { ...account, [field]: nextValue } : account),
  }))
  const submit = async (event: FormEvent) => {
    event.preventDefault()
    const parsed = businessProfileSchema.safeParse(value)
    if (!parsed.success) {
      setErrors(Object.fromEntries(parsed.error.issues.map((issue) => [String(issue.path[0]), issue.message])))
      return
    }
    setErrors({})
    await onSave({ ...parsed.data, logoBlob, stampBlob })
  }

  return <form className="form-card business-profile-form" onSubmit={submit} noValidate>
    <h2>Perfil del negocio</h2>
    <p>Estos datos se colocarán automáticamente en cada cotización.</p>

    <section className="form-section"><h3>Marca</h3>
      <label>Nombre del negocio<input {...textField('businessName')} aria-invalid={Boolean(errors.businessName)} />{errors.businessName && <span className="field-error">{errors.businessName}</span>}</label>
      <label>Lema principal<textarea {...textField('tagline')} /></label>
      <label>Teléfono del encabezado<input type="tel" {...textField('headerPhone')} /></label>
      <div className="form-grid"><label>Logo<input type="file" accept="image/*" onChange={(event) => setLogoBlob(event.target.files?.[0])} /></label><label>Sello<input type="file" accept="image/*" onChange={(event) => setStampBlob(event.target.files?.[0])} /></label></div>
    </section>

    <section className="form-section"><h3>Términos y condiciones</h3>
      {value.terms.map((term, index) => <label key={index}>Término {index + 1}<textarea value={term} onChange={(event) => updateTerm(index, event.target.value)} /></label>)}
    </section>

    <section className="form-section"><h3>Cuentas bancarias</h3>
      {value.bankAccounts.map((account, index) => <fieldset className="bank-account" key={account.id}><legend>Cuenta {index + 1}</legend>
        <label>Banco {index + 1}<input value={account.bank} onChange={(event) => updateAccount(index, 'bank', event.target.value)} /></label>
        <label>Tipo de cuenta {index + 1}<input value={account.type} onChange={(event) => updateAccount(index, 'type', event.target.value)} /></label>
        <label>Número de cuenta {index + 1}<input value={account.number} onChange={(event) => updateAccount(index, 'number', event.target.value)} /></label>
      </fieldset>)}
    </section>

    <section className="form-section"><h3>Gerente y teléfonos</h3>
      <label>Nombre del gerente<input {...textField('managerName')} aria-invalid={Boolean(errors.managerName)} />{errors.managerName && <span className="field-error">{errors.managerName}</span>}</label>
      <label>Cargo<input {...textField('managerTitle')} /></label>
      <label>Teléfono para llamadas<input type="tel" {...textField('directPhone')} /></label>
      <label>Teléfono de WhatsApp<input type="tel" {...textField('whatsappPhone')} /></label>
    </section>

    <section className="form-section"><h3>Pie de página</h3>
      <label>Mensaje de calidad<textarea {...textField('footerQuality')} /></label>
      <label>Mensaje de compromiso<textarea {...textField('footerCommitment')} /></label>
      <label>Mensaje final<textarea {...textField('footerFaith')} /></label>
    </section>

    <button className="button button--primary" type="submit">Guardar ajustes</button>
  </form>
}
