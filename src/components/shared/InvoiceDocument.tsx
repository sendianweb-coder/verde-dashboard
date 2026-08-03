import type { JSX } from 'react'

import treesImage from '@/assets/trees.png'
import type { InternalRequest, InternalRequestItem, InternalRequestProduct } from '@/types/request'

interface InvoiceDocumentProps {
  request: InternalRequest
}

interface InvoiceLine {
  item: InternalRequestItem
  unitPrice: number
}

const BLANK_VALUE = '\u00a0'

const invoiceDateFormatter = new Intl.DateTimeFormat('en-GB', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
})

const qarFormatter = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

function displayValue(value: string | null | undefined) {
  return value?.trim() || BLANK_VALUE
}

function formatInvoiceDate(value: string) {
  return invoiceDateFormatter.format(new Date(value))
}

function formatProductSpecs(product: InternalRequestProduct) {
  return [
    product.height ? `${product.height}. Ht.` : null,
    product.potSize ? `${product.potSize}. Pot` : null,
    product.lengthCm != null ? `L ${product.lengthCm} cm` : null,
    product.widthCm != null ? `W ${product.widthCm} cm` : null,
    product.heightCm != null ? `H ${product.heightCm} cm` : null,
  ].filter(Boolean).join(' | ') || BLANK_VALUE
}

const invoiceStyles = `
@import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=Inter:wght@400;500;600&display=swap');
@import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css');

@media print {
  @page { size: A4; margin: 0; }
  body.printing-invoice { background: #fff; print-color-adjust: exact; -webkit-print-color-adjust: exact; }
  body.printing-invoice #invoice-print-content,
  body.printing-invoice #invoice-print-content * { box-sizing: border-box; }
  body.printing-invoice #invoice-print-content {
    position: fixed; top: 0; left: 0; width: 210mm; height: 297mm; min-height: 1123px;
    margin: 0 !important; padding: 18px 28px 10px; break-inside: avoid-page; background: #fff; color: #222;
    font-family: Inter, Arial, sans-serif; font-size: 15px; line-height: normal; display: flex !important; flex-direction: column;
  }
  body.printing-invoice #invoice-print-content .invoice-grid { flex: 1 1 auto; width: 100%; table-layout: fixed; border-collapse: collapse; }
  body.printing-invoice #invoice-print-content .document-header { display: flex; min-height: 140px; align-items: flex-end; justify-content: space-between; }
  body.printing-invoice #invoice-print-content .brand { text-align: center; }
  body.printing-invoice #invoice-print-content .brand img { display: inline; width: 110px; height: auto; object-fit: contain; vertical-align: baseline; }
  body.printing-invoice #invoice-print-content .contact { color: #666; font-family: Cinzel, serif; margin-bottom: 10px; padding-bottom: 8px; font-size: 9px; line-height: 1.35; text-align: left; text-transform: uppercase; }
  body.printing-invoice #invoice-print-content .contact div { display: grid; grid-template-columns: 20px auto; gap: 2px; align-items: center; }
  body.printing-invoice #invoice-print-content .contact i { font-size: 9px; text-align: center; }
  body.printing-invoice #invoice-print-content .invoice-grid caption { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); }
  body.printing-invoice #invoice-print-content .invoice-grid td,
  body.printing-invoice #invoice-print-content .invoice-grid th { height: 22px; border: 0; padding: 1px 4px; vertical-align: middle; }
  body.printing-invoice #invoice-print-content .title-cell { height: 46px !important; color: #456f3d; text-align: right; vertical-align: bottom !important; }
  body.printing-invoice #invoice-print-content .title-cell h2 { margin: 0; font-family: Cinzel, serif; font-size: 20px; font-weight: 700; line-height: 1.05; }
  body.printing-invoice #invoice-print-content .title-cell p { margin: 2px 0 0; font-size: 11px; font-weight: 600; }
  body.printing-invoice #invoice-print-content .title-cell span { text-decoration: underline; }
  body.printing-invoice #invoice-print-content .recipient { padding-right: 3px !important; font-size: 12px; line-height: 1; text-align: right; }
  body.printing-invoice #invoice-print-content .reference { height: 22px !important; color: #456f3d; font-size: 13px; font-weight: 700; }
  body.printing-invoice #invoice-print-content .detail { font-size: 12px; }
  body.printing-invoice #invoice-print-content .invoice-meta td { height: 20px; padding: 2px 4px; font-size: 12px; }
  body.printing-invoice #invoice-print-content .item-head th { border: 2px solid #111; padding: 1px 3px; background: #fff; font-size: 11px; font-weight: 700; line-height: 1; text-align: center; }
  body.printing-invoice #invoice-print-content .item-row { page-break-inside: avoid; }
  body.printing-invoice #invoice-print-content .item-row td { height: 22px; border: 1px solid #111; font-size: 10px; line-height: 1; text-align: center; }
  body.printing-invoice #invoice-print-content .description { text-align: left !important; }
  body.printing-invoice #invoice-print-content .amount { text-align: right !important; }
  body.printing-invoice #invoice-print-content .subtotal-row td,
  body.printing-invoice #invoice-print-content .total-row td { height: 22px; border: 1px solid #111; font-size: 11px; font-weight: 600; text-align: right; }
  body.printing-invoice #invoice-print-content .total-row td { height: 24px; border-top: 2px solid #111; font-size: 12px; font-weight: 700; }
  body.printing-invoice #invoice-print-content .lower-cell { height: 260px !important; padding: 0 !important; vertical-align: top !important; page-break-inside: avoid; }
  body.printing-invoice #invoice-print-content .lower-field { position: relative; height: 100%; }
  body.printing-invoice #invoice-print-content .company-name,
  body.printing-invoice #invoice-print-content .signature-fields,
  body.printing-invoice #invoice-print-content .iso-certification,
  body.printing-invoice #invoice-print-content .terms-section { position: absolute; background: #fff; }
  body.printing-invoice #invoice-print-content .company-name { top: 24px; left: 4px; padding-right: 4px; font-size: 14px; text-transform: uppercase; }
  body.printing-invoice #invoice-print-content .signature-fields { top: 80px; left: 54%; width: 40%; padding: 0 4px; font-size: 13px; }
  body.printing-invoice #invoice-print-content .signature-fields div { display: flex; height: 24px; align-items: flex-end; gap: 5px; }
  body.printing-invoice #invoice-print-content .signature-fields span:first-child { width: 64px; }
  body.printing-invoice #invoice-print-content .signature-fields .line { flex: 1; border-bottom: 1px solid #222; }
  body.printing-invoice #invoice-print-content .iso-certification { top: 300px; left: 63%; width: 165px; height: 45px; }
  body.printing-invoice #invoice-print-content .iso-certification img { display: block; width: 100%; height: 100%; object-fit: contain; }
  body.printing-invoice #invoice-print-content .terms-section { bottom: 24px; left: 4px; font-size: 11px; line-height: 1.4; color: #555; }
  body.printing-invoice #invoice-print-content .terms-section p { margin: 0 0 4px; color: #222; font-size: 12px; font-weight: 600; }
  body.printing-invoice #invoice-print-content .tree-line { position: relative; height: 90px; margin-top: auto; overflow: hidden; }
  body.printing-invoice #invoice-print-content .tree-line img { position: absolute; z-index: 2; inset: 0; width: 100%; height: 100%; object-fit: cover; opacity: .17; filter: invert(40%) sepia(60%) saturate(500%) hue-rotate(55deg); }
  body.printing-invoice #invoice-print-content .tree-revision { position: absolute; z-index: 3; right: 3px; bottom: 22px; color: #555; font-family: Georgia, serif; font-size: 8px; opacity: .8; }
  body.printing-invoice #invoice-print-content .document-footer { display: grid; grid-template-columns: 1fr 1fr 1fr; margin-top: 2px; font-family: Georgia, serif; font-size: 9px; text-align: center; }
  body.printing-invoice #invoice-print-content .document-footer div:first-child { text-align: left; }
  body.printing-invoice #invoice-print-content .document-footer div:last-child { text-align: right; }
}
`

export function InvoiceDocument({ request }: InvoiceDocumentProps): JSX.Element | null {
  const invoice = request.invoice
  if (!invoice) return null

  const requestItemsById = new Map(request.items.map((item) => [item.id, item]))
  const lines: InvoiceLine[] = invoice.items.flatMap((invoiceItem) => {
    const item = requestItemsById.get(invoiceItem.requestItemId)
    return item && (item.fulfilledQuantity ?? 0) > 0 ? [{ item, unitPrice: invoiceItem.unitPrice }] : []
  })
  const subtotal = lines.reduce((total, { item, unitPrice }) => total + (item.fulfilledQuantity ?? 0) * unitPrice, 0)

  return (
    <article id="invoice-print-content" className="request-print-document page" aria-label="Printable invoice">
      <style>{invoiceStyles}</style>
      <header className="document-header">
        <div className="brand"><img src="/31.png" alt="Verde logo" /></div>
        <address className="contact">
          <div><i className="fas fa-building" aria-hidden="true" /><span>Ground Floor</span></div>
          <div><i className="fas fa-building" aria-hidden="true" /><span>Building 106</span></div>
          <div><i className="fas fa-map-marker-alt" aria-hidden="true" /><span>Strt 102 | Zone 69</span></div>
          <div><i className="fas fa-phone" aria-hidden="true" /><span>+974 40 17 35 25</span></div>
          <div><i className="fab fa-whatsapp" aria-hidden="true" /><span>+974 66 67 08 50</span></div>
          <div><i className="fas fa-fax" aria-hidden="true" /><span>+974 40 17 20 62</span></div>
          <div><i className="fas fa-envelope" aria-hidden="true" /><span>Verde Qatar</span></div>
          <div><i className="fas fa-globe" aria-hidden="true" /><span>Verdeqatar.com</span></div>
          <div><i className="fas fa-signs-post" aria-hidden="true" /><span>31403, Doha, Qatar</span></div>
        </address>
      </header>
      <table className="invoice-grid">
        <caption>Invoice {invoice.number}</caption>
        <colgroup><col span={12} /></colgroup>
        <tbody>
          <tr><td className="title-cell" colSpan={12}><h2>Invoice</h2><p>Invoice No: <span>{invoice.number}</span></p></td></tr>
          <tr><td /><td colSpan={11} /></tr>
          <tr><td colSpan={9} /><td className="recipient" colSpan={3}>{displayValue(request.project.client)}</td></tr>
          <tr><td colSpan={9} /><td className="recipient" colSpan={3}>{displayValue(request.project.location)}</td></tr>
          <tr><td className="reference" colSpan={12}>Ref: {request.id}</td></tr>
          <tr><td colSpan={6} /><td colSpan={6} /></tr>
          <tr><td className="detail" colSpan={6}>PROJECT : {displayValue(request.project.name)}</td><td colSpan={6} /></tr>
          <tr><td className="detail" colSpan={6}>SUBJECT : {displayValue(request.notes)}</td><td colSpan={6} /></tr>
          <tr><td colSpan={12} style={{ height: 6 }} /></tr>
          <tr className="invoice-meta"><td colSpan={9} /><td colSpan={3}><table style={{ width: '100%', borderCollapse: 'collapse' }}><tbody><tr><td style={{ padding: '2px 4px', fontWeight: 600, width: '30%' }}>Date:</td><td style={{ padding: '2px 4px' }}>{formatInvoiceDate(invoice.issuedAt)}</td></tr><tr><td style={{ padding: '2px 4px', fontWeight: 600 }}>PO Ref:</td><td style={{ padding: '2px 4px' }}>{request.id}</td></tr></tbody></table></td></tr>
          <tr><td colSpan={12} style={{ height: 8 }} /></tr>
          <tr className="item-head"><th scope="col">ITEM</th><th scope="col" colSpan={4}>DESCRIPTION</th><th scope="col" colSpan={2}>Specs</th><th scope="col">QTY</th><th scope="col">UNIT</th><th scope="col">PRICE</th><th scope="col" colSpan={2}>AMOUNT (QAR)</th></tr>
          {lines.map(({ item, unitPrice }, index) => {
            const quantity = item.fulfilledQuantity ?? 0
            return <tr className="item-row" key={item.id}><td>{index + 1}</td><td className="description" colSpan={4}>{displayValue(item.product.name)}</td><td colSpan={2}>{formatProductSpecs(item.product)}</td><td>{quantity}</td><td>{displayValue(item.product.unitOfMeasure)}</td><td className="amount">{qarFormatter.format(unitPrice)}</td><td className="amount" colSpan={2}>{qarFormatter.format(quantity * unitPrice)}</td></tr>
          })}
          <tr><td colSpan={12} style={{ height: 12 }} /></tr>
          <tr className="subtotal-row"><td colSpan={9} style={{ border: 'none' }} /><td>Subtotal:</td><td className="amount" colSpan={2}>{qarFormatter.format(subtotal)}</td></tr>
          <tr className="total-row"><td colSpan={9} style={{ border: 'none' }} /><td>Total Due:</td><td className="amount" colSpan={2}>QAR {qarFormatter.format(subtotal)}</td></tr>
          <tr><td className="lower-cell" colSpan={12}><div className="lower-field"><div className="company-name">Verde Landscaping &amp; Gardening</div><div className="signature-fields"><div><span>Name:</span><span className="line" /></div><div><span>Mobile:</span><span className="line" /></div><div><span>Signature:</span><span className="line" /></div></div><div className="iso-certification"><img src="/iso-certification.svg" alt="Verde ISO 9001 certification" /></div><div className="terms-section"><p>Terms &amp; Conditions:</p>Payment due within 14 days of invoice date.<br />Goods remain property of Verde Landscaping until paid in full.</div></div></td></tr>
        </tbody>
      </table>
      <div className="tree-line" aria-label="Revision artwork"><span className="tree-revision">CR-4135S</span><img src={treesImage} alt="" /></div>
      <footer className="document-footer"><div>Doc. No.: F-210</div><div>Rev. No.: 00</div><div>Rev. Date : {formatInvoiceDate(invoice.issuedAt)}</div></footer>
    </article>
  )
}
