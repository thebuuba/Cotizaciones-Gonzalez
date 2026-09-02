import { Award, CheckCircle2, ClipboardList, Grid2X2, Hammer, Heart, MessageCircle, Phone, ShieldCheck, UserRound } from 'lucide-react'
import { useEffect, useState } from 'react'

import banreservasLogo from '../../assets/bank-logos/banreservas.svg'
import santacruzLogo from '../../assets/bank-logos/santacruz.png'
import scotiabankLogo from '../../assets/bank-logos/scotiabank.svg'
import { calculateMaterialTotal, calculateQuotationTotals, formatMoney } from '../../domain/money'
import type { BusinessProfile, MaterialItem, QuotationSnapshot } from '../../domain/types'
import { paginateDocument } from './documentPagination'
import '../../styles/quotation-document.css'

function estimateRowHeight(item: MaterialItem): number {
  return 38 + Math.max(0, Math.ceil(item.description.length / 42) - 1) * 15
}

function formatQuantity(quantityMilli: number): string {
  return new Intl.NumberFormat('es-DO', { maximumFractionDigits: 3 }).format(quantityMilli / 1000)
}

function formatDate(value: string): string {
  const [year, month, day] = value.split('-')
  return year && month && day ? `${day}/${month}/${year}` : value
}

function useBlobUrl(blob?: Blob): string | undefined {
  const [url, setUrl] = useState<string>()

  useEffect(() => {
    if (!blob || typeof URL.createObjectURL !== 'function') {
      setUrl(undefined)
      return
    }
    const nextUrl = URL.createObjectURL(blob)
    setUrl(nextUrl)
    return () => URL.revokeObjectURL(nextUrl)
  }, [blob])

  return url
}

function Brand({ business, logoUrl, compact = false, mini = false }: { business: BusinessProfile; logoUrl?: string; compact?: boolean; mini?: boolean }) {
  return <div className={`document-brand${compact ? ' document-brand--compact' : ''}${mini ? ' document-brand--mini' : ''}`}>
    {logoUrl
      ? <img className="document-business-logo" src={logoUrl} alt={business.businessName} />
      : <div className="document-mark"><Grid2X2 aria-hidden="true" /><Hammer aria-hidden="true" /></div>}
    <div className="document-brand-copy">
      <strong>{business.businessName}</strong>
      {!compact && !mini && <span>{business.tagline}</span>}
    </div>
  </div>
}

function MaterialTable({ items, startIndex }: { items: MaterialItem[]; startIndex: number }) {
  return <div className="document-table" role="table">
    <div role="rowgroup">
      <div className="document-table-row document-table-heading" role="row">
        <div role="columnheader">#</div><div role="columnheader">DESCRIPCIÓN</div><div role="columnheader">CANTIDAD</div><div role="columnheader">UNIDAD</div><div role="columnheader">PRECIO UNITARIO</div><div role="columnheader">TOTAL</div>
      </div>
    </div>
    <div role="rowgroup">
      {items.map((item, index) => <div className="document-table-row" role="row" key={item.id}>
        <div role="cell">{startIndex + index + 1}</div>
        <div role="cell">{item.description}</div>
        <div role="cell">{formatQuantity(item.quantityMilli)}</div>
        <div role="cell">{item.unit}</div>
        <div role="cell">{formatMoney(item.unitPriceMinor)}</div>
        <div role="cell">{formatMoney(calculateMaterialTotal(item))}</div>
      </div>)}
    </div>
  </div>
}

const bankLogos: Record<string, string> = {
  banreservas: banreservasLogo,
  reservas: banreservasLogo,
  'santa cruz': santacruzLogo,
  'banco santa cruz': santacruzLogo,
  scotiabank: scotiabankLogo,
}

function getBankLogo(bankName: string): string | null {
  const lower = bankName.toLowerCase()
  for (const [key, logo] of Object.entries(bankLogos)) if (lower.includes(key)) return logo
  return null
}

function ClosingBlocks({ snapshot, logoUrl, stampUrl }: { snapshot: QuotationSnapshot; logoUrl?: string; stampUrl?: string }) {
  const { business, quotation, materialItems } = snapshot
  const totals = calculateQuotationTotals(materialItems, quotation.laborMinor)

  return <div className="document-closing">
    <section className="document-totals">
      <div><span>Total de materiales</span><strong>{formatMoney(totals.materialsMinor)}</strong></div>
      <div><span>Mano de obra instalación</span><strong>{formatMoney(totals.laborMinor)}</strong></div>
      <div className="document-grand-total"><span>Total general</span><strong>{formatMoney(totals.totalMinor)}</strong></div>
    </section>

    <div className="document-two-column">
      <section className="document-box">
        <h3><ClipboardList aria-hidden="true" />TÉRMINOS &amp; CONDICIONES</h3>
        {business.terms.map((term, index) => <p key={`${index}-${term}`}><CheckCircle2 aria-hidden="true" />{term}</p>)}
      </section>
      <section className="document-box document-observations">
        <h3>OBSERVACIONES</h3>
        <p>{quotation.observations || 'Sin observaciones.'}</p>
      </section>
    </div>

    <section className="document-business-strip">
      <div className="document-contact-col document-contact-col--accounts">
        <span className="document-contact-label">CUENTAS PARA DEPÓSITO / TRANSFERENCIA</span>
        {business.bankAccounts.map((account) => {
          const bankLogo = getBankLogo(account.bank)
          return <div className="document-bank-row" key={account.id}>
            {bankLogo && <img className="document-bank-logo" src={bankLogo} alt={account.bank} />}
            <div className="document-bank-info"><strong>{account.bank}</strong><span>{account.type} · {account.number}</span></div>
          </div>
        })}
      </div>

      <div className="document-contact-col document-contact-col--identity">
        {stampUrl ? <img className="document-stamp" src={stampUrl} alt="Sello del negocio" /> : <Brand business={business} logoUrl={logoUrl} mini />}
        <div className="manager-name">{business.managerName}</div>
        <div className="manager-title">{business.managerTitle}</div>
      </div>

      <div className="document-contact-col document-contact-col--contact">
        <span className="document-contact-label">CONTACTO</span>
        <div className="document-phone-row"><Phone aria-hidden="true" /><div><strong>{business.directPhone}</strong><small>LLAMADAS DIRECTAS</small></div></div>
        <div className="document-phone-row"><MessageCircle aria-hidden="true" /><div><strong>{business.whatsappPhone}</strong><small>WHATSAPP</small></div></div>
      </div>
    </section>

    <footer className="document-footer">
      <p><ShieldCheck aria-hidden="true" />{business.footerQuality}</p>
      <p><Award aria-hidden="true" />{business.footerCommitment}</p>
      <strong>{business.footerFaith} <Heart aria-hidden="true" /></strong>
    </footer>
  </div>
}

export function QuotationDocument({ snapshot, rowHeight = estimateRowHeight }: { snapshot: QuotationSnapshot; rowHeight?: (item: MaterialItem) => number }) {
  const logoUrl = useBlobUrl(snapshot.business.logoBlob)
  const stampUrl = useBlobUrl(snapshot.business.stampBlob)
  const pages = paginateDocument(snapshot.materialItems, {
    firstPageCapacity: 690,
    continuationPageCapacity: 900,
    closingHeight: 320,
    rowHeight,
  })

  let startIndex = 0
  return <div className="document-preview" aria-label="Vista previa de la cotización">{pages.map((page) => {
    const pageStart = startIndex
    startIndex += page.items.length

    return <article className="quotation-page" data-export-page data-testid={`quotation-page-${page.pageNumber}`} key={page.pageNumber}>
      {page.isFirst ? <>
        <header className="document-header">
          <div className="document-header-band">
            <Brand business={snapshot.business} logoUrl={logoUrl} />
            <div className="document-header-contact"><small>CONTACTO</small><strong><Phone aria-hidden="true" />{snapshot.business.headerPhone}</strong></div>
          </div>
          <div className="document-title-row">
            <div className="document-title-copy"><span>PROPUESTA COMERCIAL</span><h2>COTIZACIÓN</h2><small>{snapshot.quotation.number}</small></div>
            <div className="document-date"><span>FECHA</span><strong>{formatDate(snapshot.quotation.issueDate)}</strong></div>
          </div>
        </header>

        <section className="document-client">
          <h3><UserRound aria-hidden="true" />DATOS DEL CLIENTE</h3>
          <div className="document-client-fields">
            <p><strong>Nombre</strong><span>{snapshot.quotation.clientName}</span></p>
            <p><strong>Dirección</strong><span>{snapshot.quotation.clientAddress}</span></p>
          </div>
        </section>
      </> : <header className="document-continuation">
        <Brand business={snapshot.business} logoUrl={logoUrl} compact />
        <div><span>{snapshot.quotation.number}</span><small>Página {page.pageNumber}</small></div>
      </header>}

      <MaterialTable items={page.items} startIndex={pageStart} />
      {page.includesClosing && <ClosingBlocks snapshot={snapshot} logoUrl={logoUrl} stampUrl={stampUrl} />}
    </article>
  })}</div>
}
