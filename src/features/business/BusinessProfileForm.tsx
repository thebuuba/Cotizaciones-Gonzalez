import { useState, type ChangeEvent, type FormEvent } from 'react'
import { Check, LoaderCircle, TriangleAlert } from 'lucide-react'

import { createDefaultBusinessProfile } from '../../db/defaults'
import { FormErrorSummary } from '../../components/FormErrorSummary'
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
type SaveState = 'idle' | 'saving' | 'saved' | 'error'

export function BusinessProfileForm({ initialValue = empty, onSave }: {
  initialValue?: BusinessProfileFormValue
  onSave: (value: BusinessProfileFormValue) => void | Promise<void>
}) {
  const [value, setValue] = useState<BusinessProfileDraft>(initialValue)
  const [logoBlob, setLogoBlob] = useState<Blob | undefined>(initialValue.logoBlob)
  const [stampBlob, setStampBlob] = useState<Blob | undefined>(initialValue.stampBlob)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saveState, setSaveState] = useState<SaveState>('idle')
  const [dirty, setDirty] = useState(false)

  const markDirty = () => { setDirty(true); setSaveState('idle') }
  const textField = (name: keyof BusinessProfileDraft) => ({
    value: String(value[name]),
    onChange: (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      markDirty()
      setValue((current) => ({ ...current, [name]: event.target.value }))
    },
  })
  const updateTerm = (index: number, term: string) => {
    markDirty()
    setValue((current) => ({ ...current, terms: current.terms.map((item, itemIndex) => itemIndex === index ? term : item) }))
  }
  const updateAccount = (index: number, field: 'bank' | 'type' | 'number', nextValue: string) => {
    markDirty()
    setValue((current) => ({ ...current, bankAccounts: current.bankAccounts.map((account, accountIndex) => accountIndex === index ? { ...account, [field]: nextValue } : account) }))
  }
  const selectLogo = (event: ChangeEvent<HTMLInputElement>) => { markDirty(); setLogoBlob(event.target.files?.[0]) }
  const selectStamp = (event: ChangeEvent<HTMLInputElement>) => { markDirty(); setStampBlob(event.target.files?.[0]) }

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    const parsed = businessProfileSchema.safeParse(value)
    if (!parsed.success) {
      setErrors(Object.fromEntries(parsed.error.issues.map((issue) => [String(issue.path[0]), issue.message])))
      setSaveState('idle')
      return
    }
    setErrors({})
    setSaveState('saving')
    try {
      await onSave({ ...parsed.data, logoBlob, stampBlob })
      setDirty(false)
      setSaveState('saved')
    } catch {
      setSaveState('error')
    }
  }

  return <form className="settings-business-form" onSubmit={submit} noValidate>
    <div className="settings-business-heading">
      <h2>Datos del negocio</h2>
      <p>Esta información aparece automáticamente en tus cotizaciones.</p>
    </div>

    <FormErrorSummary errors={errors} />

    <section className="settings-form-section" aria-labelledby="business-brand-title">
      <h3 id="business-brand-title">Marca</h3>
      <div className="settings-form-group">
        <label className="settings-form-row"><span>Nombre</span><input {...textField('businessName')} aria-invalid={Boolean(errors.businessName)} /></label>
        {errors.businessName && <span className="field-error settings-form-error">{errors.businessName}</span>}
        <label className="settings-form-block"><span>Lema principal</span><textarea {...textField('tagline')} /></label>
        <label className="settings-form-row"><span>Teléfono</span><input type="tel" {...textField('headerPhone')} /></label>
        <label className="settings-form-file"><span>Logo</span><input type="file" accept="image/*" onChange={selectLogo} /></label>
        <label className="settings-form-file"><span>Sello</span><input type="file" accept="image/*" onChange={selectStamp} /></label>
      </div>
      <p className="settings-ios-help">Identidad visible en el encabezado de cada documento.</p>
    </section>

    <section className="settings-form-section" aria-labelledby="business-manager-title">
      <h3 id="business-manager-title">Contacto</h3>
      <div className="settings-form-group">
        <label className="settings-form-row"><span>Gerente</span><input {...textField('managerName')} aria-invalid={Boolean(errors.managerName)} /></label>
        {errors.managerName && <span className="field-error settings-form-error">{errors.managerName}</span>}
        <label className="settings-form-row"><span>Cargo</span><input {...textField('managerTitle')} /></label>
        <label className="settings-form-row"><span>Llamadas</span><input type="tel" {...textField('directPhone')} /></label>
        <label className="settings-form-row"><span>WhatsApp</span><input type="tel" {...textField('whatsappPhone')} /></label>
      </div>
    </section>

    <section className="settings-form-section" aria-labelledby="business-accounts-title">
      <h3 id="business-accounts-title">Cuentas bancarias</h3>
      <div className="settings-bank-list">
        {value.bankAccounts.map((account, index) => <fieldset className="settings-bank-card" key={account.id}>
          <legend>Cuenta {index + 1}</legend>
          <label className="settings-form-row"><span>Banco</span><input aria-label={`Banco ${index + 1}`} value={account.bank} onChange={(event) => updateAccount(index, 'bank', event.target.value)} /></label>
          <label className="settings-form-row"><span>Tipo</span><input aria-label={`Tipo de cuenta ${index + 1}`} value={account.type} onChange={(event) => updateAccount(index, 'type', event.target.value)} /></label>
          <label className="settings-form-row"><span>Número</span><input aria-label={`Número de cuenta ${index + 1}`} value={account.number} onChange={(event) => updateAccount(index, 'number', event.target.value)} /></label>
        </fieldset>)}
      </div>
      <p className="settings-ios-help">Datos de pago incluidos al final de la cotización.</p>
    </section>

    <section className="settings-form-section" aria-labelledby="business-terms-title">
      <h3 id="business-terms-title">Términos y condiciones</h3>
      <div className="settings-form-group settings-form-group--blocks">
        {value.terms.map((term, index) => <label className="settings-form-block" key={index}><span>Término {index + 1}</span><textarea value={term} onChange={(event) => updateTerm(index, event.target.value)} /></label>)}
      </div>
    </section>

    <section className="settings-form-section" aria-labelledby="business-footer-title">
      <h3 id="business-footer-title">Pie de página</h3>
      <div className="settings-form-group settings-form-group--blocks">
        <label className="settings-form-block"><span>Mensaje de calidad</span><textarea {...textField('footerQuality')} /></label>
        <label className="settings-form-block"><span>Mensaje de compromiso</span><textarea {...textField('footerCommitment')} /></label>
        <label className="settings-form-block"><span>Mensaje final</span><textarea {...textField('footerFaith')} /></label>
      </div>
    </section>

    {(dirty || saveState !== 'idle') && <div className="settings-ios-savebar">
      <span className="settings-save-feedback" aria-live="polite">
        {saveState === 'saving' && <span className="settings-save-feedback--saving" role="status"><LoaderCircle className="is-spinning" aria-hidden="true" />Guardando</span>}
        {saveState === 'saved' && <span className="settings-save-feedback--saved" role="status"><Check aria-hidden="true" />Cambios guardados</span>}
        {saveState === 'error' && <span className="settings-save-feedback--error" role="alert"><TriangleAlert aria-hidden="true" />No se pudo guardar</span>}
      </span>
      {dirty && <button className="button button--primary" type="submit" disabled={saveState === 'saving'}>
        {saveState === 'saving' ? <><LoaderCircle className="is-spinning" aria-hidden="true" />Guardando</> : <><Check aria-hidden="true" />Guardar</>}
      </button>}
    </div>}
  </form>
}
