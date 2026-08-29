import { useState, type FormEvent } from 'react'
import { businessProfileSchema, type BusinessProfileDraft } from './businessProfileSchema'

const empty: BusinessProfileDraft = { businessName: '', ownerName: '', phone: '', email: '', address: '' }
export type BusinessProfileFormValue = BusinessProfileDraft & { logoBlob?: Blob; signatureBlob?: Blob }
export function BusinessProfileForm({ initialValue = empty, onSave }: { initialValue?: BusinessProfileFormValue; onSave: (value: BusinessProfileFormValue) => void | Promise<void> }) {
  const [value, setValue] = useState(initialValue)
  const [logoBlob, setLogoBlob] = useState<Blob | undefined>(initialValue.logoBlob)
  const [signatureBlob, setSignatureBlob] = useState<Blob | undefined>(initialValue.signatureBlob)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const field = (name: keyof BusinessProfileDraft) => ({ value: value[name], onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setValue((current) => ({ ...current, [name]: event.target.value })) })
  const submit = async (event: FormEvent) => { event.preventDefault(); const parsed = businessProfileSchema.safeParse(value); if (!parsed.success) { setErrors(Object.fromEntries(parsed.error.issues.map((issue) => [String(issue.path[0]), issue.message]))); return } setErrors({}); await onSave({ ...parsed.data, logoBlob, signatureBlob }) }
  return <form className="form-card" onSubmit={submit} noValidate><h2>Perfil del negocio</h2><p>Esta información aparecerá en tus cotizaciones.</p>
    <label>Nombre del negocio<input {...field('businessName')} aria-invalid={Boolean(errors.businessName)} />{errors.businessName && <span className="field-error">{errors.businessName}</span>}</label>
    <label>Propietario<input {...field('ownerName')} aria-invalid={Boolean(errors.ownerName)} />{errors.ownerName && <span className="field-error">{errors.ownerName}</span>}</label>
    <label>Teléfono<input type="tel" autoComplete="tel" {...field('phone')} /></label>
    <label>Correo electrónico<input type="email" autoComplete="email" {...field('email')} />{errors.email && <span className="field-error">{errors.email}</span>}</label>
    <label>Dirección<textarea {...field('address')} /></label>
    <div className="form-grid"><label>Logo<input type="file" accept="image/*" onChange={(event) => setLogoBlob(event.target.files?.[0])} /></label><label>Firma<input type="file" accept="image/*" onChange={(event) => setSignatureBlob(event.target.files?.[0])} /></label></div>
    <button className="button button--primary" type="submit">Guardar perfil</button>
  </form>
}
