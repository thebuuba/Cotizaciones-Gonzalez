import { ArrowDown, ArrowUp, Plus, Save, Trash2 } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useFieldArray, useForm, useWatch } from 'react-hook-form'

import type { ClientRecord } from '../../db/repositories'
import { calculateMaterialTotal, calculateQuotationTotals, formatMoney, parseQuantityToMilli } from '../../domain/money'
import type { BusinessProfile, MaterialItem, QuotationSnapshot } from '../../domain/types'
import { parseMoneyInput, quotationDraftSchema, type QuotationDraft } from './quotationSchema'
import { useAutosave } from './useAutosave'

const units = ['unidad', 'm²', 'm', 'pie', 'funda', 'caja', 'galón']
const newMaterial = () => ({ id: crypto.randomUUID(), description: '', quantity: '', unit: 'unidad', unitPrice: '' })

function initialDraft(initialValue?: QuotationSnapshot): QuotationDraft {
  if (!initialValue) return {
    clientId: '', clientName: '', clientAddress: '',
    issueDate: new Date().toISOString().slice(0, 10), labor: '', observations: '',
    materials: [newMaterial()],
  }
  return {
    clientId: initialValue.quotation.clientId,
    clientName: initialValue.quotation.clientName,
    clientAddress: initialValue.quotation.clientAddress,
    issueDate: initialValue.quotation.issueDate,
    labor: String(initialValue.quotation.laborMinor / 100),
    observations: initialValue.quotation.observations,
    materials: initialValue.materialItems.map((item) => ({
      id: item.id,
      description: item.description,
      quantity: String(item.quantityMilli / 1000),
      unit: item.unit,
      unitPrice: String(item.unitPriceMinor / 100),
    })),
  }
}

function safeMaterialTotal(quantity: string, unitPrice: string): number {
  try {
    return calculateMaterialTotal({ quantityMilli: parseQuantityToMilli(quantity), unitPriceMinor: parseMoneyInput(unitPrice) })
  } catch {
    return 0
  }
}

export function QuotationEditor({ business, clients, initialValue, initialClientId, initialLocationId, onSave }: {
  business: BusinessProfile
  clients: ClientRecord[]
  initialValue?: QuotationSnapshot
  initialClientId?: string
  initialLocationId?: string
  onSave: (snapshot: QuotationSnapshot) => Promise<void>
}) {
  const createdAt = useRef(initialValue?.quotation.createdAt ?? new Date().toISOString())
  const quotationId = useRef(initialValue?.quotation.id ?? crypto.randomUUID())
  const defaults = initialDraft(initialValue)
  const preselected = clients.find(({ client }) => client.id === initialClientId)
  if (!initialValue && preselected) {
    defaults.clientId = preselected.client.id
    defaults.clientName = preselected.client.name
    defaults.clientAddress = preselected.locations.find((location) => location.id === initialLocationId)?.address ?? preselected.client.address
  }
  const { control, getValues, register, setValue } = useForm<QuotationDraft>({ defaultValues: defaults })
  const { fields, append, remove, swap } = useFieldArray({ control, name: 'materials', keyName: 'fieldKey' })
  const draft = useWatch({ control }) as QuotationDraft

  const snapshot = useMemo(() => {
    const parsed = quotationDraftSchema.safeParse(draft)
    const clientRecord = clients.find(({ client }) => client.id === parsed.data?.clientId)
    if (!parsed.success || !clientRecord) return undefined
    try {
      const materialItems: MaterialItem[] = parsed.data.materials.map((item, position) => ({
        id: item.id,
        quotationId: quotationId.current,
        description: item.description,
        quantityMilli: parseQuantityToMilli(item.quantity),
        unit: item.unit,
        unitPriceMinor: parseMoneyInput(item.unitPrice),
        position,
      }))
      return {
        business,
        client: clientRecord.client,
        quotation: {
          id: quotationId.current,
          number: initialValue?.quotation.number ?? '',
          clientId: clientRecord.client.id,
          clientName: parsed.data.clientName,
          clientAddress: parsed.data.clientAddress,
          issueDate: parsed.data.issueDate,
          status: initialValue?.quotation.status ?? 'draft',
          laborMinor: parsed.data.labor.trim() ? parseMoneyInput(parsed.data.labor) : 0,
          observations: parsed.data.observations.trim(),
          templateVersion: 1 as const,
          createdAt: createdAt.current,
          updatedAt: new Date().toISOString(),
        },
        materialItems,
      } satisfies QuotationSnapshot
    } catch {
      return undefined
    }
  }, [business, clients, draft, initialValue])
  const autosave = useAutosave({ value: snapshot as QuotationSnapshot, canSave: Boolean(snapshot), onSave, revision: JSON.stringify(draft) })
  const [manualStatus, setManualStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const saveNow = async () => {
    if (!snapshot) return
    setManualStatus('saving')
    try {
      await onSave(snapshot)
      setManualStatus('saved')
    } catch {
      setManualStatus('error')
    }
  }

  const rowTotals = draft.materials.map((item) => safeMaterialTotal(item.quantity, item.unitPrice))
  const laborMinor = (() => { try { return draft.labor.trim() ? parseMoneyInput(draft.labor) : 0 } catch { return 0 } })()
  const totals = calculateQuotationTotals(rowTotals.map((total) => ({ quantityMilli: 1_000, unitPriceMinor: total })), laborMinor)
  const chooseClient = (clientId: string) => {
    const record = clients.find(({ client }) => client.id === clientId)
    setValue('clientId', clientId)
    setValue('clientName', record?.client.name ?? '')
    setValue('clientAddress', record?.locations[0]?.address ?? record?.client.address ?? '')
  }

  useEffect(() => {
    if (initialValue || !initialClientId || getValues('clientId')) return
    const record = clients.find(({ client }) => client.id === initialClientId)
    if (!record) return
    setValue('clientId', record.client.id)
    setValue('clientName', record.client.name)
    setValue('clientAddress', record.locations.find((location) => location.id === initialLocationId)?.address ?? record.client.address)
  }, [clients, getValues, initialClientId, initialLocationId, initialValue, setValue])

  return <form className="quotation-editor" onSubmit={(event) => event.preventDefault()}>
    <header className="editor-intro"><div><span>Nueva cotización</span><h2>Datos de la hoja</h2></div><div className="editor-actions"><span className={`save-state save-state--${manualStatus === 'idle' ? autosave.status : manualStatus}`} aria-live="polite">{{ idle: 'Sin guardar', pending: 'Guardando…', saving: 'Guardando…', saved: 'Guardado', error: 'Error al guardar' }[manualStatus === 'idle' ? autosave.status : manualStatus]}</span><button className="button button--primary" type="button" onClick={() => void saveNow()} disabled={!snapshot || manualStatus === 'saving'}><Save aria-hidden="true" />{manualStatus === 'saving' ? 'Guardando…' : 'Guardar'}</button></div></header>

    <section className="editor-section"><h3>Datos del cliente</h3>
      <label>Cliente<select {...register('clientId')} onChange={(event) => chooseClient(event.target.value)}><option value="">Seleccionar cliente</option>{clients.map(({ client }) => <option key={client.id} value={client.id}>{client.name}</option>)}</select></label>
      <label>Nombre del cliente<input {...register('clientName')} /></label>
      <label>Dirección<input {...register('clientAddress')} /></label>
      <label>Fecha<input type="date" {...register('issueDate')} /></label>
    </section>

    <section className="editor-section"><div className="section-heading"><div><span>Materiales</span><h3>Partidas de la cotización</h3></div><button className="button button--quiet" type="button" onClick={() => append(newMaterial())}><Plus aria-hidden="true" />Agregar material</button></div>
      <datalist id="material-units">{units.map((unit) => <option key={unit} value={unit} />)}</datalist>
      <div className="material-list">{fields.map((field, index) => <article className="material-card" key={field.fieldKey}>
        <div className="material-card__heading"><strong>Material {index + 1}</strong><div className="material-actions">
          <button className="icon-button" type="button" disabled={index === 0} onClick={() => swap(index, index - 1)} aria-label={`Subir material ${index + 1}`}><ArrowUp aria-hidden="true" /></button>
          <button className="icon-button" type="button" disabled={index === fields.length - 1} onClick={() => swap(index, index + 1)} aria-label={`Bajar material ${index + 1}`}><ArrowDown aria-hidden="true" /></button>
          <button className="icon-button icon-button--danger" type="button" disabled={fields.length === 1} onClick={() => remove(index)} aria-label={`Eliminar material ${index + 1}`}><Trash2 aria-hidden="true" /></button>
        </div></div>
        <label>Descripción {index + 1}<input {...register(`materials.${index}.description`)} /></label>
        <div className="material-grid"><label>Cantidad {index + 1}<input inputMode="decimal" {...register(`materials.${index}.quantity`)} /></label><label>Unidad {index + 1}<input list="material-units" {...register(`materials.${index}.unit`)} /></label></div>
        <div className="form-field"><label htmlFor={`material-price-${index}`}>Precio unitario {index + 1}</label><div className="money-input"><span>RD$</span><input id={`material-price-${index}`} inputMode="decimal" {...register(`materials.${index}.unitPrice`)} /></div></div>
        <div className="row-total"><span>Total</span><strong data-testid={`material-total-${index}`}>{formatMoney(rowTotals[index] ?? 0)}</strong></div>
      </article>)}</div>
    </section>

    <section className="editor-section totals-section"><div><span>Total de materiales</span><strong data-testid="materials-total">{formatMoney(totals.materialsMinor)}</strong></div><div className="form-field"><label htmlFor="quotation-labor">Mano de obra instalación</label><div className="money-input"><span>RD$</span><input id="quotation-labor" inputMode="decimal" {...register('labor')} /></div></div><div className="general-total"><span>Total general</span><strong data-testid="general-total">{formatMoney(totals.totalMinor)}</strong></div></section>
    <section className="editor-section"><label>Observaciones<textarea rows={5} {...register('observations')} /></label></section>
  </form>
}
