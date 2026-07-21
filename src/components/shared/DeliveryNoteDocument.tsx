import { Building2, Globe, Landmark, Mail, MapPin, MessageCircle, Phone, Printer, Signpost } from 'lucide-react'
import type { JSX } from 'react'

import type {
  ApprovalEvent,
  InternalRequest,
  InternalRequestItem,
  InternalRequestProduct,
} from '@/types/request'
import treesImage from '@/assets/trees.png'

interface DeliveryNoteDocumentProps {
  request: InternalRequest
  pickupEvent?: ApprovalEvent
  pickedItems: InternalRequestItem[]
}

const deliveryDateFormatter = new Intl.DateTimeFormat('en-GB', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
})

const MINIMUM_ITEM_ROWS = 6
const BLANK_VALUE = '\u00a0'

const deliveryNoteStyles = `
@media print {
  @page {
    size: A4;
    margin: 5mm;
  }

  body.printing-delivery-note #delivery-note-print-content {
    display: block !important;
    width: 100%;
    min-height: 287mm;
    margin: 0 !important;
    color: #222;
    background: #fff;
    font-family: Inter, Arial, sans-serif;
    font-size: 10pt;
    line-height: 1.25;
  }

  body.printing-delivery-note #delivery-note-print-content,
  body.printing-delivery-note #delivery-note-print-content * {
    box-sizing: border-box;
  }

  body.printing-delivery-note #delivery-note-print-content .delivery-note-header {
    display: flex;
    min-height: 42mm;
    align-items: flex-end;
    justify-content: space-between;
  }

  body.printing-delivery-note #delivery-note-print-content .delivery-note-brand {
    text-align: center;
  }

  body.printing-delivery-note #delivery-note-print-content .delivery-note-brand img {
    display: block;
    width: 34mm;
    height: auto;
    object-fit: contain;
  }

  body.printing-delivery-note #delivery-note-print-content .delivery-note-contact {
    display: grid;
    gap: 0.7mm;
    align-items: end;
    padding-bottom: 2mm;
    color: #666;
    font-family: Cinzel, Georgia, 'Times New Roman', serif;
    font-size: 8pt;
    font-style: italic !important;
    line-height: 1.2;
    text-align: left;
    text-transform: uppercase;
  }

  body.printing-delivery-note #delivery-note-print-content .delivery-note-contact,
  body.printing-delivery-note #delivery-note-print-content .delivery-note-contact * {
    font-style: italic !important;
  }

  body.printing-delivery-note #delivery-note-print-content .delivery-note-contact div {
    display: grid;
    grid-template-columns: 5mm auto;
    gap: 1mm;
    align-items: center;
  }

  body.printing-delivery-note #delivery-note-print-content .delivery-note-contact svg {
    width: 3.2mm;
    height: 3.2mm;
    stroke-width: 1.8;
  }

  body.printing-delivery-note #delivery-note-print-content .delivery-note-grid {
    width: 100%;
    table-layout: fixed;
    border: 1px solid #d9ddd7;
    border-collapse: collapse;
  }

  body.printing-delivery-note #delivery-note-print-content .delivery-note-grid caption {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip: rect(0 0 0 0);
  }

  body.printing-delivery-note #delivery-note-print-content .delivery-note-grid td,
  body.printing-delivery-note #delivery-note-print-content .delivery-note-grid th {
    height: 6.2mm;
    border: 1px solid #d9ddd7;
    padding: 1mm 1.2mm;
    vertical-align: middle;
  }

  body.printing-delivery-note #delivery-note-print-content .delivery-note-title-cell {
    height: 17mm !important;
    color: #456f3d;
    text-align: right;
    vertical-align: bottom !important;
  }

  body.printing-delivery-note #delivery-note-print-content .delivery-note-title-cell h1 {
    margin: 0;
    color: #456f3d;
    font-family: Cinzel, Georgia, 'Times New Roman', serif;
    font-size: 18pt;
    font-weight: 700;
    line-height: 1.05;
  }

  body.printing-delivery-note #delivery-note-print-content .delivery-note-title-cell p {
    margin: 1mm 0 0;
    font-size: 8.5pt;
    font-weight: 600;
  }

  body.printing-delivery-note #delivery-note-print-content .delivery-note-title-cell span {
    text-decoration: underline;
  }

  body.printing-delivery-note #delivery-note-print-content .delivery-note-recipient {
    padding-right: 1mm !important;
    font-size: 9pt;
    line-height: 1;
    text-align: right;
  }

  body.printing-delivery-note #delivery-note-print-content .delivery-note-reference {
    height: 6.2mm !important;
    border: 2px solid #456f3d !important;
    color: #456f3d;
    font-size: 9pt;
    font-weight: 700;
    text-align: left;
  }

  body.printing-delivery-note #delivery-note-print-content .delivery-note-detail {
    font-size: 9pt;
    text-align: left;
  }

  body.printing-delivery-note #delivery-note-print-content .delivery-note-item-head th {
    height: 7.2mm;
    border: 2px solid #111;
    padding: 1mm;
    background: #fff;
    font-size: 9pt;
    font-weight: 700;
    line-height: 1;
    text-align: center;
    text-transform: uppercase;
  }

  body.printing-delivery-note #delivery-note-print-content .delivery-note-item-row td,
  body.printing-delivery-note #delivery-note-print-content .delivery-note-empty-row td {
    height: 6.2mm;
    border: 1px solid #111;
    font-size: 8.5pt;
    line-height: 1.15;
    text-align: center;
  }

  body.printing-delivery-note #delivery-note-print-content .delivery-note-item-row.tall td {
    height: 8mm;
  }

  body.printing-delivery-note #delivery-note-print-content .delivery-note-item-row .description {
    text-align: left;
  }

  body.printing-delivery-note #delivery-note-print-content .delivery-note-lower-cell {
    height: 100mm !important;
    padding: 0 !important;
    vertical-align: top !important;
  }

  body.printing-delivery-note #delivery-note-print-content .delivery-note-lower-field {
    position: relative;
    min-height: 100mm;
    height: 100%;
  }

  body.printing-delivery-note #delivery-note-print-content .delivery-note-company,
  body.printing-delivery-note #delivery-note-print-content .delivery-note-received,
  body.printing-delivery-note #delivery-note-print-content .delivery-note-signatures {
    position: absolute;
    background: #fff;
  }

  body.printing-delivery-note #delivery-note-print-content .delivery-note-company {
    top: 8mm;
    left: 1mm;
    padding-right: 1mm;
    font-size: 9pt;
    text-transform: uppercase;
  }

  body.printing-delivery-note #delivery-note-print-content .delivery-note-received {
    top: 13mm;
    left: 68%;
    padding: 0 1mm;
    font-size: 8.5pt;
  }

  body.printing-delivery-note #delivery-note-print-content .delivery-note-signatures {
    top: 22mm;
    left: 54%;
    width: 40%;
    padding: 0 1mm;
    font-size: 8.5pt;
  }

  body.printing-delivery-note #delivery-note-print-content .delivery-note-signatures div {
    display: flex;
    height: 7mm;
    align-items: flex-end;
    gap: 1.5mm;
  }

  body.printing-delivery-note #delivery-note-print-content .delivery-note-signatures span:first-child {
    width: 17mm;
  }

  body.printing-delivery-note #delivery-note-print-content .delivery-note-signatures .line {
    flex: 1;
    border-bottom: 1px solid #222;
  }

  body.printing-delivery-note #delivery-note-print-content .delivery-note-tree {
    position: relative;
    display: block;
    height: 15mm;
    margin: 0;
    overflow: hidden;
    line-height: 0;
  }

  body.printing-delivery-note #delivery-note-print-content .delivery-note-tree img {
    position: absolute;
    z-index: 2;
    inset: 0;
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: center;
    opacity: 0.25;
  }

  body.printing-delivery-note #delivery-note-print-content .delivery-note-tree-revision {
    position: absolute;
    z-index: 3;
    right: 1mm;
    bottom: 1mm;
    color: #555;
    font-family: Georgia, 'Times New Roman', serif;
    font-size: 7pt;
    line-height: 1;
  }

  body.printing-delivery-note #delivery-note-print-content .delivery-note-footer {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    margin-top: 1mm;
    color: #666;
    font-family: Cinzel, Georgia, 'Times New Roman', serif;
    font-size: 7pt;
    text-align: center;
  }

  body.printing-delivery-note #delivery-note-print-content .delivery-note-footer > span:first-child {
    text-align: left;
  }

  body.printing-delivery-note #delivery-note-print-content .delivery-note-footer > span:last-child {
    text-align: right;
  }
}
`

function formatDeliveryDate(value?: string) {
  return value ? deliveryDateFormatter.format(new Date(value)) : BLANK_VALUE
}

function displayValue(value: string | null | undefined) {
  return value?.trim() || BLANK_VALUE
}

function formatProductSpecs(product: InternalRequestProduct) {
  return [
    product.height ? `Height ${product.height}` : null,
    product.potSize ? `Pot ${product.potSize}` : null,
    product.lengthCm != null ? `L ${product.lengthCm} cm` : null,
    product.widthCm != null ? `W ${product.widthCm} cm` : null,
    product.heightCm != null ? `H ${product.heightCm} cm` : null,
  ].filter(Boolean).join(' · ') || BLANK_VALUE
}

function getItemRowClassName(item: InternalRequestItem) {
  return formatProductSpecs(item.product).length > 48
    ? 'delivery-note-item-row tall'
    : 'delivery-note-item-row'
}

export function DeliveryNoteDocument({ request, pickupEvent, pickedItems }: DeliveryNoteDocumentProps): JSX.Element {
  const emptyRowCount = Math.max(0, MINIMUM_ITEM_ROWS - pickedItems.length)

  return (
    <article
      id="delivery-note-print-content"
      className="request-print-document delivery-note-document"
      aria-label="Printable delivery note"
    >
      <style>{deliveryNoteStyles}</style>

      <header className="delivery-note-header">
        <div className="delivery-note-brand">
          <img src="/31.png" alt="Verde logo" />
        </div>

        <address className="delivery-note-contact">
          <div><Building2 aria-hidden="true" /><span>GROUND FLOOR</span></div>
          <div><Landmark aria-hidden="true" /><span>BUILDING 106</span></div>
          <div><MapPin aria-hidden="true" /><span>STRT 102 | ZONE 69</span></div>
          <div><Phone aria-hidden="true" /><span>+974 40 17 35 25</span></div>
          <div><MessageCircle aria-hidden="true" /><span>+974 66 67 08 50</span></div>
          <div><Printer aria-hidden="true" /><span>+974 40 17 20 62</span></div>
          <div><Mail aria-hidden="true" /><span>VERDEQATAR</span></div>
          <div><Globe aria-hidden="true" /><span>VERDEQATAR.COM</span></div>
          <div><Signpost aria-hidden="true" /><span>31403, DOHA, QATAR</span></div>
        </address>
      </header>

      <table className="delivery-note-grid">
        <caption>Delivery note {request.id}</caption>
        <colgroup>
          <col span={12} />
        </colgroup>
        <tbody>
          <tr>
            <td className="delivery-note-title-cell" colSpan={12}>
              <h1>Delivery Note</h1>
              <p>Ref. No: <span>{displayValue(request.id)}</span></p>
            </td>
          </tr>
          <tr>
            <td />
            <td colSpan={5} />
            <td colSpan={3} />
            <td colSpan={3} />
          </tr>
          <tr>
            <td colSpan={9} />
            <td className="delivery-note-recipient" colSpan={3}>{displayValue(request.project.client)}</td>
          </tr>
          <tr>
            <td colSpan={9} />
            <td className="delivery-note-recipient" colSpan={3}>{displayValue(request.project.location)}</td>
          </tr>
          <tr>
            <td className="delivery-note-reference" colSpan={12}>Ref: {displayValue(request.requester.id)}</td>
          </tr>
          <tr>
            <td colSpan={6} />
            <td colSpan={3} />
            <td colSpan={3} />
          </tr>
          <tr>
            <td className="delivery-note-detail" colSpan={6}>PROJECT : {displayValue(request.project.name)}</td>
            <td colSpan={3} />
            <td colSpan={3} />
          </tr>
          <tr>
            <td className="delivery-note-detail" colSpan={6}>SUBJECT : {displayValue(request.notes)}</td>
            <td colSpan={3} />
            <td colSpan={3} />
          </tr>
          <tr className="delivery-note-item-head">
            <th scope="col">ITEM</th>
            <th scope="col" colSpan={5}>DESCRIPTION</th>
            <th scope="col" colSpan={3}>Specs</th>
            <th scope="col">UNIT</th>
            <th scope="col" colSpan={2}>QUANTITY</th>
          </tr>
          {pickedItems.map((item, index) => (
            <tr className={getItemRowClassName(item)} key={item.id}>
              <td>{index + 1}</td>
              <td className="description" colSpan={5}>{displayValue(item.product.name)}</td>
              <td colSpan={3}>{formatProductSpecs(item.product)}</td>
              <td>{displayValue(item.product.unitOfMeasure)}</td>
              <td colSpan={2}>{item.fulfilledQuantity ?? BLANK_VALUE}</td>
            </tr>
          ))}
          {Array.from({ length: emptyRowCount }, (_, index) => (
            <tr className="delivery-note-empty-row" key={`empty-${index}`} aria-hidden="true">
              <td>{BLANK_VALUE}</td>
              <td colSpan={5}>{BLANK_VALUE}</td>
              <td colSpan={3}>{BLANK_VALUE}</td>
              <td>{BLANK_VALUE}</td>
              <td colSpan={2}>{BLANK_VALUE}</td>
            </tr>
          ))}
          <tr>
            <td className="delivery-note-lower-cell" colSpan={12}>
              <div className="delivery-note-lower-field">
                <div className="delivery-note-company">VERDE LANDSCAPING &amp; GARDENING</div>
                <div className="delivery-note-received">Received by:</div>
                <div className="delivery-note-signatures">
                  <div><span>Name:</span><span className="line" /></div>
                  <div><span>Mobile:</span><span className="line" /></div>
                  <div><span>Signature:</span><span className="line" /></div>
                </div>
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      <div className="delivery-note-tree" aria-label="Revision artwork">
        <img src={treesImage} alt="" />
        <span className="delivery-note-tree-revision">CR-4135S</span>
      </div>

      <footer className="delivery-note-footer">
        <span>Doc. No.: F-209</span>
        <span>Rev. No.: 00</span>
        <span>Rev. Date : {formatDeliveryDate(pickupEvent?.createdAt)}</span>
      </footer>
    </article>
  )
}
