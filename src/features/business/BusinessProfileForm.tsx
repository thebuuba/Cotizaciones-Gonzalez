import { useState, type ChangeEvent, type FormEvent } from 'react'
import {
  Building2,
  Check,
  FileText,
  Images,
  Landmark,
  LoaderCircle,
  ScrollText,
  TriangleAlert,
  UserRoundCog,
  type LucideIcon,
} from 'lucide-react'

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

function FormSectionHeading({ id, Icon, title, description }: {
  id: string
  Icon: LucideIcon
  title: string
  description: string
}) {
  return <div className="form-section__header">
    <span className="form-section__icon"><Icon aria-hidden="true" /></span>
    <div><h3 id={id}>{title}</h3><small>{description}</small></div>
  </div>
}

export function BusinessProfileForm({ initialValue = empty, onSave }: {
  initialValue?: BusinessProfileFormValue
  onSave: (value: BusinessProfileFormValue) => void | Promise<void>
}) {
  const [value, setValue] = useState<BusinessProfileDraft>(initialValue)
  const [logoBlob, setLogoBlob] = useState<Blob | undefined>(initialValue.logoBlob)
  const [stampBlob, setStampBlob] = useState<Blob | undefined>(initialValue.stampBlob)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saveState, setSaveState] = useState<SaveState>('idle')

  const textField = (name: keyof BusinessProfileDraft) => ({
    value: String(value[name]),
    onChange: (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setSaveState('idle')
      setValue((current) => ({ ...current, [name]: event.target.value }))
    },
  })
  const updateTerm = (index: number, term: string) => {
    setSaveState('idle')
    setValue((current) => ({
      ...current,
      terms: current.terms.map((item, itemIndex) => itemIndex === index ? term : item),
    }))
  }
  const updateAccount = (index: number, field: 'bank' | 'type' | 'number', nextValue: string) => {
    setSaveState('idle')
    setValue((current) => ({
      ...current,
      bankAccounts: current.bankAccounts.map((account, accountIndex) => accountIndex === index ? { ...account, [field]: nextValue } : account),
    }))
  }
  const selectLogo = (event: ChangeEvent<HTMLInputElement>) => {
    setSaveState('idle')
    setLogoBlob(event.target.files?.[0])
  }
  const selectStamp = (event: ChangeEvent<HTMLInputElement>) => {
    setSaveState('idle')
    setStampBlob(event.target.files?.[0])
  }
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
      setSaveState('saved')
    } catch {
      setSaveState('error')
    }
  }

  return <form className="form-card business-profile-form" onSubmit={submit} noValidate>
    <div className="business-profile-form__intro">
      <span className="business-profile-form__icon"><Building2 aria-hidden="true" /></span>
      <div><h2>Perfil del negocio</h2><p>Estos datos se colocarán automáticamente en cada cotización.</p></div>
    </div>
    <FormErrorSummary errors={errors} />

    <section className="form-section" aria-labelledby="business-brand-title">
      <FormSectionHeading id="business-brand-title" Icon={Images} title="Marca" description="Identidad visible en el encabezado de tus documentos." />
      <label>Nombre del negocio<input {...textField('businessName')} aria-invalid={Boolean(errors.businessName)} />{errors.businessName && <span className="field-error">{errors.businessName}</span>}</label>
      <label>Lema principal<textarea {...textField('tagline')} /></label>
      <label>Teléfono del encabezado<input type="tel" {...textField('headerPhone')} /></label>
      <div className="form-grid"><label>Logo<input type="file" accept="image/*" onChange={selectLogo} /></label><label>Sello<input type="file" accept="image/*" onChange={selectStamp} /></label></div>
    </section>

    <section className="form-section" aria-labelledby="business-terms-title">
      <FormSectionHeading id="business-terms-title" Icon={ScrollText} title="Términos y condiciones" description="Condiciones que acompañan cada propuesta comercial." />
      {value.terms.map((term, index) => <label key={index}>Término {index + 1}<textarea value={term} onChange={(event) => updateTerm(index, event.target.value)} /></label>)}
    </section>

    <section className="form-section" aria-labelledby="business-accounts-title">
      <FormSectionHeading id="business-accounts-title" Icon={Landmark} title="Cuentas bancarias" description="Datos de pago incluidos al final de la cotización." />
      {value.bankAccounts.map((account, index) => <fieldset className="bank-account" key={account.id}><legend>Cuenta {index + 1}</legend>
        <label>Banco {index + 1}<input value={account.bank} onChange={(event) => updateAccount(index, 'bank', event.target.value)} /></label>
        <label>Tipo de cuenta {index + 1}<input value={account.type} onChange={(event) => updateAccount(index, 'type', event.target.value)} /></label>
        <label>Número de cuenta {index + 1}<input value={account.number} onChange={(event) => updateAccount(index, 'number', event.target.value)} /></label>
      </fieldset>)}
    </section>

    <section className="form-section" aria-labelledby="business-manager-title">
      <FormSectionHeading id="business-manager-title" Icon={UserRoundCog} title="Gerente y teléfonos" description="Contacto responsable que recibirá el cliente." />
      <label>Nombre del gerente<input {...textField('managerName')} aria-invalid={Boolean(errors.managerName)} />{errors.managerName && <span className="field-error">{errors.managerName}</span>}</label>
      <label>Cargo<input {...textField('managerTitle')} /></label>
      <label>Teléfono para llamadas<input type="tel" {...textField('directPhone')} /></label>
      <label>Teléfono de WhatsApp<input type="tel" {...textField('whatsappPhone')} /></label>
    </section>

    <section className="form-section" aria-labelledby="business-footer-title">
      <FormSectionHeading id="business-footer-title" Icon={FileText} title="Pie de página" description="Mensajes de cierre y valores del negocio." />
      <label>Mensaje de calidad<textarea {...textField('footerQuality')} /></label>
      <label>Mensaje de compromiso<textarea {...textField('footerCommitment')} /></label>
      <label>Mensaje final<textarea {...textField('footerFaith')} /></label>
    </section>

    <div className="settings-save-bar">
      <span className="settings-save-feedback" aria-live="polite">
        {saveState === 'saving' && <span className="settings-save-feedback--saving" role="status"><LoaderCircle className="is-spinning" aria-hidden="true" />Guardando cambios</span>}
        {saveState === 'saved' && <span className="settings-save-feedback--saved" role="status"><Check aria-hidden="true" />Ajustes guardados</span>}
        {saveState === 'error' && <span className="settings-save-feedback--error" role="alert"><TriangleAlert aria-hidden="true" />No se pudieron guardar los ajustes. Intenta nuevamente.</span>}
      </span>
      <button className="button button--primary" type="submit" disabled={saveState === 'saving'}>
        {saveState === 'saving' ? <><LoaderCircle className="is-spinning" aria-hidden="true" />Guardando ajustes</> : <><Check aria-hidden="true" />Guardar ajustes</>}
      </button>
    </div>
  </form>
}
