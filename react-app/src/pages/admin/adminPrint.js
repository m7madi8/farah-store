import { getAdminFirestore } from '@/lib/firebase';
import { mapFirestoreOrder } from '@/lib/firestoreMappers';
import { translations } from '@/data/translations';
import { computeProductSalesStats, formatMoney } from './salesStats';
import { isApprovedOrder, normalizeOrderStatus } from './orderUtils';
import { formatCoordinates, hasValidLocation } from '@/lib/googleMaps';

const STORE_LOGO_PATH = '/img/logo.webp';
const INVOICE_LANG = 'en';
const invoiceT = (key) => translations.en[key] ?? key;

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function logoUrl() {
  return new URL(STORE_LOGO_PATH, window.location.origin).href;
}

function formatWhen(iso, locale) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString(locale === 'ar' ? 'ar' : 'en-GB', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  } catch {
    return String(iso);
  }
}

function printStyles(variant = 'full') {
  const compact = variant === 'compact';
  const receiptStyles = compact
    ? `
    body {
      padding: 0;
      font-size: 11px;
      line-height: 1.4;
      background: #fff;
      direction: ltr;
      text-align: left;
    }
    .print-sheet--compact {
      width: 100%;
      max-width: 302px;
      padding: 14px 12px 16px;
      background: #fff;
      direction: ltr;
    }
    .print-header {
      margin-bottom: 10px;
      padding-bottom: 10px;
      border-bottom: 1px solid #e8e0ef;
    }
    .print-logo {
      max-height: 52px;
      margin-bottom: 8px;
      border-radius: 50%;
      padding: 2px;
      background: #fff;
      box-shadow: 0 2px 8px rgba(75, 42, 99, 0.12);
    }
    .print-brand {
      font-size: 1rem;
      letter-spacing: 0.01em;
    }
    .print-title {
      margin: 0 0 10px;
      font-size: 0.72rem;
      font-weight: 700;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: #6b5a7a;
    }
    .receipt-block {
      margin-bottom: 10px;
      padding-bottom: 10px;
      border-bottom: 1px dashed #ddd;
    }
    .receipt-block:last-of-type { border-bottom: none; }
    .receipt-block-title {
      margin: 0 0 6px;
      font-size: 0.68rem;
      font-weight: 700;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      color: #4b2a63;
    }
    .receipt-row {
      display: grid;
      grid-template-columns: minmax(4.5rem, 36%) 1fr;
      gap: 6px 8px;
      align-items: start;
      padding: 3px 0;
    }
    .receipt-row + .receipt-row { border-top: 1px dotted #eee; }
    .receipt-label {
      color: #666;
      font-size: 0.68rem;
      font-weight: 600;
    }
    .receipt-value {
      margin: 0;
      text-align: end;
      font-size: 0.72rem;
      color: #111;
      word-break: break-word;
    }
    .receipt-value--ltr {
      direction: ltr;
      unicode-bidi: isolate;
    }
    .receipt-items-head {
      display: grid;
      grid-template-columns: 1fr auto auto;
      gap: 6px;
      padding: 5px 0 4px;
      border-bottom: 1px solid #4b2a63;
      font-size: 0.65rem;
      font-weight: 700;
      color: #4b2a63;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
    .receipt-items-head span:not(:first-child) { text-align: end; }
    .receipt-item {
      display: grid;
      grid-template-columns: 1fr auto auto;
      gap: 6px;
      align-items: start;
      padding: 6px 0;
      border-bottom: 1px dotted #eee;
      font-size: 0.72rem;
    }
    .receipt-item-name {
      font-weight: 600;
      color: #222;
      line-height: 1.35;
    }
    .receipt-item-qty,
    .receipt-item-total {
      text-align: end;
      white-space: nowrap;
      color: #333;
    }
    .receipt-item-total { font-weight: 700; }
    .print-total {
      margin-top: 8px;
      padding: 8px 0 0;
      border-top: 2px solid #4b2a63;
      font-size: 0.95rem;
    }
    .print-total span:last-child {
      color: #4b2a63;
      font-size: 1rem;
    }
    .print-footer {
      margin-top: 12px;
      padding-top: 8px;
      border-top: 1px dashed #ddd;
      font-size: 0.68rem;
      color: #888;
    }
    a { color: inherit; text-decoration: none; }
  `
    : '';

  return `
    * { box-sizing: border-box; }
    body {
      font-family: "Segoe UI", Tahoma, Arial, sans-serif;
      color: #1a1a1a;
      margin: 0;
      padding: ${compact ? '0' : '24px'};
      line-height: ${compact ? '1.4' : '1.45'};
      font-size: ${compact ? '11px' : '14px'};
    }
    .print-sheet {
      max-width: ${compact ? '302px' : '720px'};
      margin: 0;
    }
    .print-sheet--compact { width: 100%; }
    ${receiptStyles}
    .print-header {
      text-align: center;
      margin-bottom: ${compact ? '10px' : '24px'};
      padding-bottom: ${compact ? '10px' : '16px'};
      border-bottom: ${compact ? '1px solid #e8e0ef' : '2px solid #4a3862'};
    }
    .print-logo {
      display: block;
      margin: 0 auto ${compact ? '8px' : '12px'};
      max-height: ${compact ? '52px' : '88px'};
      width: auto;
      object-fit: contain;
    }
    .print-brand {
      margin: 0;
      font-size: ${compact ? '1rem' : '1.35rem'};
      color: #4a3862;
      font-weight: 700;
    }
    .print-subtitle {
      margin: ${compact ? '2px 0 0' : '4px 0 0'};
      font-size: ${compact ? '0.72rem' : '0.95rem'};
      color: #666;
    }
    .print-title {
      margin: 0 0 ${compact ? '10px' : '16px'};
      font-size: ${compact ? '0.72rem' : '1.15rem'};
      font-weight: 700;
      text-align: center;
    }
    .print-meta {
      display: grid;
      gap: ${compact ? '4px' : '8px'};
      margin-bottom: ${compact ? '10px' : '20px'};
      font-size: ${compact ? '0.72rem' : '0.92rem'};
    }
    .print-meta-row {
      display: flex;
      justify-content: space-between;
      gap: ${compact ? '6px' : '12px'};
      border-bottom: 1px solid #eee;
      padding-bottom: ${compact ? '3px' : '6px'};
    }
    .print-meta-row dt { margin: 0; font-weight: 600; color: #444; flex-shrink: 0; }
    .print-meta-row dd {
      margin: 0;
      text-align: end;
      word-break: break-word;
      max-width: ${compact ? '58%' : 'none'};
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: ${compact ? '8px 0' : '16px 0'};
      font-size: ${compact ? '0.68rem' : '0.9rem'};
    }
    th, td {
      border: 1px solid #ddd;
      padding: ${compact ? '3px 4px' : '8px 10px'};
      text-align: start;
    }
    th { background: #f5f0f8; color: #4a3862; font-weight: 600; }
    td.num, th.num { text-align: end; white-space: nowrap; }
    .print-total {
      display: flex;
      justify-content: space-between;
      font-size: ${compact ? '0.95rem' : '1.05rem'};
      font-weight: 700;
      margin-top: ${compact ? '8px' : '12px'};
      padding-top: ${compact ? '8px' : '12px'};
      border-top: ${compact ? '2px solid #4b2a63' : '2px solid #4a3862'};
    }
    .print-total--minor {
      font-size: ${compact ? '0.78rem' : '0.92rem'};
      font-weight: 600;
      margin-top: ${compact ? '4px' : '8px'};
      padding-top: ${compact ? '4px' : '6px'};
      border-top: 1px dashed #ddd;
    }
    .print-total--discount span:last-child { color: #2e7d32; }
    .print-summary-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 20px; }
    .print-summary-card { border: 1px solid #ddd; border-radius: 8px; padding: 12px; text-align: center; }
    .print-summary-card small { display: block; color: #666; margin-bottom: 4px; }
    .print-summary-card strong { font-size: 1.1rem; color: #4a3862; }
    .print-footer {
      margin-top: ${compact ? '12px' : '28px'};
      font-size: ${compact ? '0.68rem' : '0.8rem'};
      color: #888;
      text-align: center;
    }
  `;
}

function receiptRow(label, value, { ltr = false } = {}) {
  if (value == null || value === '') return '';
  const valueClass = ltr ? 'receipt-value receipt-value--ltr' : 'receipt-value';
  return `
    <div class="receipt-row">
      <span class="receipt-label">${escapeHtml(label)}</span>
      <p class="${valueClass}">${escapeHtml(value)}</p>
    </div>
  `;
}

function formatInvoiceWhen(iso) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('en-GB', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  } catch {
    return String(iso);
  }
}

function stripVariantSuffix(name) {
  return String(name || '').replace(/\s*\([^)]*\)\s*$/, '').trim();
}

function findCatalogProduct(item, bySlug, byId, catalog) {
  if (item.product_slug && bySlug.has(item.product_slug)) return bySlug.get(item.product_slug);
  if (item.product_id && byId.has(item.product_id)) return byId.get(item.product_id);

  const stored = String(item.product_name || '').trim();
  if (!stored) return null;

  const baseStored = stripVariantSuffix(stored);
  return (
    catalog.find((product) => product.name === stored || product.name_ar === stored) ||
    catalog.find((product) => product.name === baseStored || product.name_ar === baseStored) ||
    null
  );
}

function findVariantForItem(item, variants = []) {
  if (!variants.length) return null;

  const byKey = item.variant_key
    ? variants.find((variant) => String(variant.key) === String(item.variant_key))
    : null;
  if (byKey) return byKey;

  const unitPrice = Number(item.unit_price) || 0;
  const byPrice = variants.find((variant) => Number(variant.price) === unitPrice);
  if (byPrice) return byPrice;

  const stored = String(item.product_name || '');
  const match = stored.match(/\(([^)]+)\)\s*$/);
  if (!match) return null;

  const label = match[1].trim();
  return (
    variants.find((variant) => variant.labelEn === label || variant.labelAr === label) || null
  );
}

function resolveEnglishItemName(item, catalogProduct) {
  if (!catalogProduct) return item.product_name || '—';

  const baseName = catalogProduct.name || catalogProduct.name_en || item.product_name || '—';
  const variant = findVariantForItem(item, catalogProduct.variants);
  return variant?.labelEn ? `${baseName} (${variant.labelEn})` : baseName;
}

async function prepareInvoiceOrder(order) {
  const items = order.order_items || [];
  if (!items.length) return order;

  try {
    const [{ collection, getDocs }, db] = await Promise.all([
      import('firebase/firestore'),
      getAdminFirestore(),
    ]);
    const snap = await getDocs(collection(db, 'products'));
    const bySlug = new Map();
    const byId = new Map();
    const catalog = snap.docs.map((docSnap) => {
      const product = { id: docSnap.id, ...docSnap.data() };
      if (product.slug) bySlug.set(product.slug, product);
      byId.set(docSnap.id, product);
      return product;
    });

    return {
      ...order,
      order_items: items.map((item) => {
        const catalogProduct = findCatalogProduct(item, bySlug, byId, catalog);
        return {
          ...item,
          product_name: resolveEnglishItemName(item, catalogProduct),
        };
      }),
    };
  } catch {
    return order;
  }
}

function buildCompactInvoiceHtml(order) {
  const t = invoiceT;
  const items = order.order_items || [];
  const payment =
    order.payment_method === 'cod' ? t('admin.paymentCod') : order.payment_method || '—';

  const itemRows = items
    .map((item) => {
      const qty = Number(item.quantity) || 0;
      const unit = Number(item.unit_price) || 0;
      const line = qty * unit;
      return `
        <div class="receipt-item">
          <span class="receipt-item-name">${escapeHtml(item.product_name || '—')}</span>
          <span class="receipt-item-qty">${qty} × ${formatMoney(unit)}</span>
          <span class="receipt-item-total">${formatMoney(line)}</span>
        </div>
      `;
    })
    .join('');

  const gpsText = hasValidLocation(order)
    ? formatCoordinates(order.location_lat, order.location_lng, INVOICE_LANG)
    : '';

  return `
    <div class="print-sheet print-sheet--compact">
      ${printHeaderHtml(t, true)}
      <h2 class="print-title">${escapeHtml(t('admin.invoiceTitle'))}</h2>

      <section class="receipt-block">
        <h3 class="receipt-block-title">${escapeHtml(t('admin.invoiceSectionOrder'))}</h3>
        ${receiptRow(t('admin.invoiceOrderNo'), order.id?.slice(0, 8) || '—', { ltr: true })}
        ${receiptRow(t('admin.colDate'), formatInvoiceWhen(order.created_at))}
        ${receiptRow(t('admin.colStatus'), statusLabel(order.status, t))}
        ${receiptRow(t('admin.paymentMethod'), payment)}
        ${order.discount_code ? receiptRow(t('admin.colDiscountCode'), order.discount_code, { ltr: true }) : ''}
      </section>

      <section class="receipt-block">
        <h3 class="receipt-block-title">${escapeHtml(t('admin.invoiceSectionCustomer'))}</h3>
        ${receiptRow(t('admin.colCustomer'), order.customer_name || '—')}
        ${receiptRow(t('admin.colPhone'), order.customer_phone || '—', { ltr: true })}
        ${receiptRow(t('admin.colAddress'), order.shipping_address || '—')}
        ${gpsText ? receiptRow(t('admin.colLocation'), gpsText, { ltr: true }) : ''}
        ${order.notes ? receiptRow(t('admin.colNotes'), order.notes) : ''}
      </section>

      <section class="receipt-block">
        <h3 class="receipt-block-title">${escapeHtml(t('admin.colItems'))}</h3>
        <div class="receipt-items-head">
          <span>${escapeHtml(t('admin.colItems'))}</span>
          <span>${escapeHtml(t('admin.invoiceQty'))}</span>
          <span>${escapeHtml(t('admin.invoiceLineTotal'))}</span>
        </div>
        ${itemRows || `<div class="receipt-item"><span class="receipt-item-name">${escapeHtml(t('admin.statsNoData'))}</span><span></span><span></span></div>`}
      </section>

      ${order.discount_code ? `
        <div class="print-total print-total--minor">
          <span>${escapeHtml(t('admin.colSubtotal'))}</span>
          <span>${formatMoney(order.subtotal)}</span>
        </div>
        <div class="print-total print-total--minor print-total--discount">
          <span>${escapeHtml(t('admin.colDiscount'))} (${escapeHtml(order.discount_code)} −${order.discount_percent}%)</span>
          <span>−${formatMoney(order.discount_amount)}</span>
        </div>
      ` : ''}
      <div class="print-total">
        <span>${escapeHtml(t('admin.colTotal'))}</span>
        <span>${formatMoney(order.total)}</span>
      </div>
      <p class="print-footer">${escapeHtml(t('admin.invoiceThankYou'))}</p>
    </div>
  `;
}

function buildPrintDocument(title, bodyHtml, lang, variant = 'full') {
  const dir = lang === 'ar' ? 'rtl' : 'ltr';
  return `<!DOCTYPE html>
<html lang="${lang === 'ar' ? 'ar' : 'en'}" dir="${dir}">
<head>
  <meta charset="UTF-8" />
  <title>${escapeHtml(title)}</title>
  <style>${printStyles(variant)}</style>
</head>
<body>${bodyHtml}</body>
</html>`;
}

function waitForImages(doc, timeoutMs = 3000) {
  const images = Array.from(doc.querySelectorAll('img'));
  if (!images.length) return Promise.resolve();

  return Promise.race([
    Promise.all(
      images.map(
        (img) =>
          new Promise((resolve) => {
            if (img.complete) {
              resolve();
              return;
            }
            img.addEventListener('load', resolve, { once: true });
            img.addEventListener('error', resolve, { once: true });
          })
      )
    ),
    new Promise((resolve) => {
      window.setTimeout(resolve, timeoutMs);
    }),
  ]);
}

function sanitizeFilename(name) {
  return String(name || 'document')
    .replace(/[^\w\u0600-\u06FF.-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80) || 'document';
}

async function captureHtmlAsCanvas(title, bodyHtml, lang, options = {}) {
  const { variant = 'full' } = options;

  const iframe = document.createElement('iframe');
  iframe.setAttribute('title', title);
  iframe.setAttribute('aria-hidden', 'true');
  iframe.style.position = 'fixed';
  iframe.style.left = '-10000px';
  iframe.style.top = '0';
  iframe.style.width = variant === 'compact' ? '302px' : '794px';
  iframe.style.height = '1px';
  iframe.style.border = '0';
  iframe.style.visibility = 'hidden';
  document.body.appendChild(iframe);

  const frameDoc = iframe.contentDocument || iframe.contentWindow?.document;
  if (!frameDoc) {
    iframe.remove();
    throw new Error('Export failed');
  }

  frameDoc.open();
  frameDoc.write(buildPrintDocument(title, bodyHtml, lang, variant));
  frameDoc.close();

  await waitForImages(frameDoc);

  const sheet = frameDoc.body.querySelector('.print-sheet') || frameDoc.body;
  const { default: html2canvas } = await import('html2canvas');

  const canvas = await html2canvas(sheet, {
    scale: 2,
    useCORS: true,
    allowTaint: true,
    logging: false,
    backgroundColor: '#ffffff',
  });

  iframe.remove();
  return canvas;
}

function triggerImageDownload(canvas, filename) {
  const link = document.createElement('a');
  link.download = sanitizeFilename(filename);
  link.href = canvas.toDataURL('image/png', 1.0);
  document.body.appendChild(link);
  link.click();
  link.remove();
}

async function downloadImageFromHtml(title, bodyHtml, lang, options = {}) {
  const { variant = 'full', filename = 'document.png' } = options;
  const canvas = await captureHtmlAsCanvas(title, bodyHtml, lang, { variant });
  triggerImageDownload(canvas, filename);
}

async function downloadPdfFromHtml(title, bodyHtml, lang, options = {}) {
  const { variant = 'full', filename = 'document.pdf' } = options;

  const canvas = await captureHtmlAsCanvas(title, bodyHtml, lang, { variant });
  const imgData = canvas.toDataURL('image/png', 1.0);
  const { jsPDF } = await import('jspdf');

  if (variant === 'compact') {
    const margin = 4;
    const contentWidth = 80 - margin * 2;
    const imgWidth = contentWidth;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    const pageHeight = Math.max(imgHeight + margin * 2, 45);
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: [80, pageHeight],
    });
    pdf.addImage(imgData, 'PNG', margin, margin, imgWidth, imgHeight);
    pdf.save(sanitizeFilename(filename));
    return;
  }

  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 10;
  const imgWidth = pageWidth - margin * 2;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;
  let heightLeft = imgHeight;
  let position = margin;

  pdf.addImage(imgData, 'PNG', margin, position, imgWidth, imgHeight);
  heightLeft -= pageHeight - margin * 2;

  while (heightLeft > 0) {
    position = heightLeft - imgHeight + margin;
    pdf.addPage();
    pdf.addImage(imgData, 'PNG', margin, position, imgWidth, imgHeight);
    heightLeft -= pageHeight - margin * 2;
  }

  pdf.save(sanitizeFilename(filename));
}

function printHeaderHtml(t, compact = false) {
  const brand = escapeHtml(t('admin.brandSub'));
  const url = escapeHtml(logoUrl());
  return `
    <header class="print-header">
      <img class="print-logo" src="${url}" alt="${brand}" />
      <h1 class="print-brand">${brand}</h1>
      ${compact ? '' : `<p class="print-subtitle">${escapeHtml(t('admin.invoiceStoreTagline'))}</p>`}
    </header>
  `;
}

function statusLabel(status, t) {
  const key = normalizeOrderStatus(status);
  return t(`admin.status.${key}`);
}

/** Download a single customer order invoice as a PNG image (always English). */
export async function printOrderInvoice(order) {
  const invoiceOrder = await prepareInvoiceOrder(order);
  const body = buildCompactInvoiceHtml(invoiceOrder);
  const orderRef = order.id?.slice(0, 8) || 'order';
  await downloadImageFromHtml(invoiceT('admin.invoiceTitle'), body, INVOICE_LANG, {
    variant: 'compact',
    filename: `invoice-${orderRef}.png`,
  });
}

/** Fetch approved orders and download sales + profit report as PDF. */
export async function printApprovedSalesReport({ t, lang }) {
  const [{ collection, getDocs, orderBy, query }, db] = await Promise.all([
    import('firebase/firestore'),
    getAdminFirestore(),
  ]);
  const q = query(collection(db, 'orders'), orderBy('created_at', 'desc'));
  const snap = await getDocs(q);
  const approvedOrders = snap.docs
    .map((docSnap) => mapFirestoreOrder(docSnap.id, docSnap.data()))
    .filter(isApprovedOrder);

  const sales = computeProductSalesStats(approvedOrders);
  const generatedAt = formatWhen(new Date().toISOString(), lang);

  const productRows = sales.products
    .map(
      (p) => `
      <tr>
        <td>${escapeHtml(p.name)}</td>
        <td class="num">${p.quantity}</td>
        <td class="num">${formatMoney(p.revenue)}</td>
        <td class="num">${formatMoney(p.cost)}</td>
        <td class="num">${formatMoney(p.profit)}</td>
      </tr>
    `
    )
    .join('');

  const body = `
    <div class="print-sheet">
      ${printHeaderHtml(t)}
      <h2 class="print-title">${escapeHtml(t('admin.printReportTitle'))}</h2>
      <p class="print-subtitle" style="text-align:center;margin-bottom:20px;">${escapeHtml(t('admin.invoiceGeneratedAt'))}: ${escapeHtml(generatedAt)}</p>
      <div class="print-summary-grid">
        <div class="print-summary-card"><small>${escapeHtml(t('admin.statSales'))}</small><strong>${formatMoney(sales.totalRevenue)}</strong></div>
        <div class="print-summary-card"><small>${escapeHtml(t('admin.statCost'))}</small><strong>${formatMoney(sales.totalCost)}</strong></div>
        <div class="print-summary-card"><small>${escapeHtml(t('admin.statProfit'))}</small><strong>${formatMoney(sales.totalProfit)}</strong></div>
      </div>
      ${
        sales.topSeller
          ? `<p><strong>${escapeHtml(t('admin.statTopSeller'))}:</strong> ${escapeHtml(sales.topSeller.name)} (${sales.topSeller.quantity})</p>`
          : ''
      }
      ${
        sales.leastSeller
          ? `<p><strong>${escapeHtml(t('admin.statLeastSeller'))}:</strong> ${escapeHtml(sales.leastSeller.name)} (${sales.leastSeller.quantity})</p>`
          : ''
      }
      <table>
        <thead>
          <tr>
            <th>${escapeHtml(t('admin.colNameEn'))}</th>
            <th class="num">${escapeHtml(t('admin.statUnitsSold'))}</th>
            <th class="num">${escapeHtml(t('admin.statSales'))}</th>
            <th class="num">${escapeHtml(t('admin.statCost'))}</th>
            <th class="num">${escapeHtml(t('admin.statProfit'))}</th>
          </tr>
        </thead>
        <tbody>${productRows || `<tr><td colspan="5">${escapeHtml(t('admin.statsEmpty'))}</td></tr>`}</tbody>
      </table>
      <p class="print-footer">${escapeHtml(t('admin.statsSub'))}</p>
    </div>
  `;

  const dateStamp = new Date().toISOString().slice(0, 10);
  await downloadPdfFromHtml(t('admin.printReportTitle'), body, lang, {
    variant: 'full',
    filename: `sales-report-${dateStamp}.pdf`,
  });
}
