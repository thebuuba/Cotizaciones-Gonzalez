import { Award, CheckCircle2, ClipboardList, Grid2X2, Hammer, Heart, MessageCircle, Phone, ShieldCheck, UserRound } from 'lucide-react'

import banreservasLogo from '../../assets/bank-logos/banreservas.svg'
import santacruzLogo from '../../assets/bank-logos/santacruz.png'
import scotiabankLogo from '../../assets/bank-logos/scotiabank.svg'
import { calculateMaterialTotal, calculateQuotationTotals, formatMoney } from '../../domain/money'
import type { MaterialItem, QuotationSnapshot } from '../../domain/types'
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

function Brand({ compact = false }: { compact?: boolean }) {
  return <div className={`document-brand${compact ? ' document-brand--compact' : ''}`}><div className="document-mark"><Grid2X2 aria-hidden="true" /><Hammer aria-hidden="true" /></div><div><span className="brand-name">Acabados Modernos Gonzalez</span>{!compact && <strong>ACABADOS<br /><b>MODERNOS</b><br /><em>GONZALEZ</em></strong>}</div></div>
}

function MaterialTable({ items, startIndex }: { items: MaterialItem[]; startIndex: number }) {
  return <div className="document-table" role="table"><div role="rowgroup"><div className="document-table-row document-table-heading" role="row"><div role="columnheader">#</div><div role="columnheader">DESCRIPCIÓN</div><div role="columnheader">CANTIDAD</div><div role="columnheader">UNIDAD</div><div role="columnheader">PRECIO UNITARIO</div><div role="columnheader">TOTAL</div></div></div><div role="rowgroup">{items.map((item, index) => <div className="document-table-row" role="row" key={item.id}><div role="cell">{startIndex + index + 1}</div><div role="cell">{item.description}</div><div role="cell">{formatQuantity(item.quantityMilli)}</div><div role="cell">{item.unit}</div><div role="cell">{formatMoney(item.unitPriceMinor)}</div><div role="cell">{formatMoney(calculateMaterialTotal(item))}</div></div>)}</div></div>
}

const bankLogos: Record<string, string> = {
  'banreservas': banreservasLogo,
  'reservas': banreservasLogo,
  'santa cruz': santacruzLogo,
  'banco santa cruz': santacruzLogo,
  'scotiabank': scotiabankLogo,
}

function getBankLogo(bankName: string): string | null {
  const lower = bankName.toLowerCase()
  for (const [key, logo] of Object.entries(bankLogos)) {
    if (lower.includes(key)) return logo
  }
  return null
}

function ClosingBlocks({ snapshot }: { snapshot: QuotationSnapshot }) {
  const { business, quotation, materialItems } = snapshot
  const totals = calculateQuotationTotals(materialItems, quotation.laborMinor)
  return <div className="document-closing">
    <section className="document-totals"><div><span>TOTAL DE MATERIALES</span><strong>{formatMoney(totals.materialsMinor)}</strong></div><div><span>MANO DE OBRA INSTALACIÓN</span><strong>{formatMoney(totals.laborMinor)}</strong></div><div className="document-grand-total"><span>TOTAL GENERAL</span><strong>{formatMoney(totals.totalMinor)}</strong></div></section>
    <div className="document-two-column"><section className="document-box"><h3><ClipboardList aria-hidden="true" />TÉRMINOS &amp; CONDICIONES</h3>{business.terms.map((term) => <p key={term}><CheckCircle2 aria-hidden="true" />{term}</p>)}</section><section className="document-box document-observations"><h3>OBSERVACIONES</h3><p>{quotation.observations || ' '}</p></section></div>
    <div className="document-contact-row">
      <div className="document-contact-col document-contact-col--accounts">
        <span className="document-contact-label">CUENTAS PARA DEPÓSITO / TRANSFERENCIA</span>
        {business.bankAccounts.map((account) => { const logo = getBankLogo(account.bank); return <div className="document-bank-row" key={account.id}>{logo && <img className="document-bank-logo" src={logo} alt={account.bank} />}<div className="document-bank-info"><strong>{account.bank}</strong><span>{account.type} {account.number}</span></div></div> })}
      </div>
      <div className="document-contact-col document-contact-col--identity">
        <Brand />
        <div className="manager-name">{business.managerName}</div>
        <div className="manager-title">{business.managerTitle}</div>
      </div>
      <div className="document-contact-col document-contact-col--contact">
        <span className="document-contact-label">CONTACTO</span>
        <div className="document-phone-row"><Phone aria-hidden="true" /><div><strong>{business.directPhone}</strong><small>LLAMADAS DIRECTAS</small></div></div>
        <div className="document-phone-row"><MessageCircle aria-hidden="true" /><div><strong>{business.whatsappPhone}</strong><small>WHATSAPP</small></div></div>
      </div>
    </div>
    <footer className="document-footer"><p><ShieldCheck aria-hidden="true" />{business.footerQuality}</p><p><Award aria-hidden="true" />{business.footerCommitment}</p><strong>{business.footerFaith} <Heart aria-hidden="true" /></strong></footer>
  </div>
}

export function QuotationDocument({ snapshot, rowHeight = estimateRowHeight }: { snapshot: QuotationSnapshot; rowHeight?: (item: MaterialItem) => number }) {
  const pages = paginateDocument(snapshot.materialItems, {
    firstPageCapacity: 700,
    continuationPageCapacity: 900,
    closingHeight: 300,
    rowHeight,
  })
  let startIndex = 0
  return <div className="document-preview" aria-label="Vista previa de la cotización">{pages.map((page) => {
    const pageStart = startIndex
    startIndex += page.items.length
    return <article className="quotation-page" data-export-page data-testid={`quotation-page-${page.pageNumber}`} key={page.pageNumber}>
      {page.isFirst ? <header className="document-header"><div className="document-header-black"><Brand /><p>{snapshot.business.tagline}</p></div><div className="document-header-white"><p><Phone aria-hidden="true" />{snapshot.business.headerPhone}</p><h2>COTIZACIÓN</h2><div className="document-date"><strong>FECHA:</strong><span>{formatDate(snapshot.quotation.issueDate)}</span></div></div></header> : <header className="document-continuation"><Brand compact /><span>{snapshot.business.headerPhone}</span><small>Página {page.pageNumber}</small></header>}
      {page.isFirst && <section className="document-client"><h3><UserRound aria-hidden="true" />DATOS DEL CLIENTE</h3><p><strong>Nombre:</strong><span>{snapshot.quotation.clientName}</span></p><p><strong>Dirección:</strong><span>{snapshot.quotation.clientAddress}</span></p></section>}
      <MaterialTable items={page.items} startIndex={pageStart} />
      {page.includesClosing && <ClosingBlocks snapshot={snapshot} />}
    </article>
  })}</div>
}
