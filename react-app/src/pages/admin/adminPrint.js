import { getAdminFirestore } from '@/lib/firebase';
import { mapFirestoreOrder } from '@/lib/firestoreMappers';
import { computeProductSalesStats, formatMoney } from './salesStats';
import { isApprovedOrder, normalizeOrderStatus } from './orderUtils';
import { googleMapsViewUrl, hasValidLocation } from '@/lib/googleMaps';

const STORE_LOGO_PATH = '/img/logo.webp';

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
  return `
    * { box-sizing: border-box; }
    body {
      font-family: "Segoe UI", Tahoma, Arial, sans-serif;
      color: #1a1a1a;
      margin: 0;
      padding: ${compact ? '4mm' : '24px'};
      line-height: ${compact ? '1.35' : '1.45'};
      font-size: ${compact ? '10px' : '14px'};
    }
    .print-sheet {
      max-width: ${compact ? '72mm' : '720px'};
      margin: 0;
    }
    .print-sheet--compact { width: 100%; }
    .print-header {
      text-align: center;
      margin-bottom: ${compact ? '8px' : '24px'};
      padding-bottom: ${compact ? '8px' : '16px'};
      border-bottom: ${compact ? '1px dashed #bbb' : '2px solid #4a3862'};
    }
    .print-logo {
      display: block;
      margin: 0 auto ${compact ? '6px' : '12px'};
      max-height: ${compact ? '42px' : '88px'};
      width: auto;
      object-fit: contain;
    }
    .print-brand {
      margin: 0;
      font-size: ${compact ? '0.95rem' : '1.35rem'};
      color: #4a3862;
      font-weight: 700;
    }
    .print-subtitle {
      margin: ${compact ? '2px 0 0' : '4px 0 0'};
      font-size: ${compact ? '0.72rem' : '0.95rem'};
      color: #666;
    }
    .print-title {
      margin: 0 0 ${compact ? '8px' : '16px'};
      font-size: ${compact ? '0.85rem' : '1.15rem'};
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
      font-size: ${compact ? '0.82rem' : '1.05rem'};
      font-weight: 700;
      margin-top: ${compact ? '6px' : '12px'};
      padding-top: ${compact ? '6px' : '12px'};
      border-top: ${compact ? '1px dashed #bbb' : '2px solid #4a3862'};
    }
    .print-summary-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 20px; }
    .print-summary-card { border: 1px solid #ddd; border-radius: 8px; padding: 12px; text-align: center; }
    .print-summary-card small { display: block; color: #666; margin-bottom: 4px; }
    .print-summary-card strong { font-size: 1.1rem; color: #4a3862; }
    .print-footer {
      margin-top: ${compact ? '10px' : '28px'};
      font-size: ${compact ? '0.68rem' : '0.8rem'};
      color: #888;
      text-align: center;
    }
    @media print {
      @page {
        size: ${compact ? '80mm auto' : 'auto'};
        margin: ${compact ? '3mm' : '12mm'};
      }
      body { padding: ${compact ? '0' : '12px'}; }
      .print-sheet { max-width: ${compact ? '72mm' : 'none'}; }
    }
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

function removePrintFrame(iframe) {
  window.setTimeout(() => {
    iframe.remove();
  }, 1000);
}

function printHtml(title, bodyHtml, lang, options = {}) {
  const { variant = 'full' } = options;
  const iframe = document.createElement('iframe');
  iframe.setAttribute('title', title);
  iframe.setAttribute('aria-hidden', 'true');
  iframe.style.position = 'fixed';
  iframe.style.insetInlineEnd = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  iframe.style.opacity = '0';
  iframe.style.pointerEvents = 'none';
  document.body.appendChild(iframe);

  const frameWin = iframe.contentWindow;
  const frameDoc = frameWin?.document;
  if (!frameWin || !frameDoc) {
    iframe.remove();
    return;
  }

  frameDoc.open();
  frameDoc.write(buildPrintDocument(title, bodyHtml, lang, variant));
  frameDoc.close();

  const triggerPrint = () => {
    frameWin.focus();
    frameWin.print();
    if (typeof frameWin.addEventListener === 'function') {
      frameWin.addEventListener('afterprint', () => removePrintFrame(iframe), { once: true });
    }
    removePrintFrame(iframe);
  };

  const logo = frameDoc.querySelector('.print-logo');
  if (logo && !logo.complete) {
    logo.addEventListener('load', triggerPrint, { once: true });
    logo.addEventListener('error', triggerPrint, { once: true });
    window.setTimeout(triggerPrint, 1200);
  } else {
    window.setTimeout(triggerPrint, 200);
  }
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

/** Print a single customer order invoice. */
export function printOrderInvoice(order, { t, lang }) {
  const items = order.order_items || [];
  const payment =
    order.payment_method === 'cod' ? t('admin.paymentCod') : order.payment_method || '—';

  const rows = items
    .map((item) => {
      const qty = Number(item.quantity) || 0;
      const unit = Number(item.unit_price) || 0;
      const line = qty * unit;
      return `
        <tr>
          <td>${escapeHtml(item.product_name || '—')}</td>
          <td class="num">${qty}</td>
          <td class="num">${formatMoney(unit)}</td>
          <td class="num">${formatMoney(line)}</td>
        </tr>
      `;
    })
    .join('');

  const body = `
    <div class="print-sheet print-sheet--compact">
      ${printHeaderHtml(t, true)}
      <h2 class="print-title">${escapeHtml(t('admin.invoiceTitle'))}</h2>
      <dl class="print-meta">
        <div class="print-meta-row"><dt>${escapeHtml(t('admin.invoiceOrderNo'))}</dt><dd>${escapeHtml(order.id?.slice(0, 8) || '—')}</dd></div>
        <div class="print-meta-row"><dt>${escapeHtml(t('admin.colDate'))}</dt><dd>${escapeHtml(formatWhen(order.created_at, lang))}</dd></div>
        <div class="print-meta-row"><dt>${escapeHtml(t('admin.colCustomer'))}</dt><dd>${escapeHtml(order.customer_name || '—')}</dd></div>
        <div class="print-meta-row"><dt>${escapeHtml(t('admin.colPhone'))}</dt><dd>${escapeHtml(order.customer_phone || '—')}</dd></div>
        <div class="print-meta-row"><dt>${escapeHtml(t('admin.colAddress'))}</dt><dd>${escapeHtml(order.shipping_address || '—')}</dd></div>
        ${
          hasValidLocation(order)
            ? `<div class="print-meta-row"><dt>${escapeHtml(t('admin.colLocation'))}</dt><dd><a href="${escapeHtml(googleMapsViewUrl(order.location_lat, order.location_lng))}">${escapeHtml(`${order.location_lat}, ${order.location_lng}`)}</a></dd></div>`
            : ''
        }
        <div class="print-meta-row"><dt>${escapeHtml(t('admin.colStatus'))}</dt><dd>${escapeHtml(statusLabel(order.status, t))}</dd></div>
        <div class="print-meta-row"><dt>${escapeHtml(t('admin.paymentMethod'))}</dt><dd>${escapeHtml(payment)}</dd></div>
        ${order.notes ? `<div class="print-meta-row"><dt>${escapeHtml(t('admin.colNotes'))}</dt><dd>${escapeHtml(order.notes)}</dd></div>` : ''}
      </dl>
      <table>
        <thead>
          <tr>
            <th>${escapeHtml(t('admin.colItems'))}</th>
            <th class="num">${escapeHtml(t('admin.invoiceQty'))}</th>
            <th class="num">${escapeHtml(t('admin.invoiceUnitPrice'))}</th>
            <th class="num">${escapeHtml(t('admin.invoiceLineTotal'))}</th>
          </tr>
        </thead>
        <tbody>${rows || `<tr><td colspan="4">${escapeHtml(t('admin.statsNoData'))}</td></tr>`}</tbody>
      </table>
      <div class="print-total">
        <span>${escapeHtml(t('admin.colTotal'))}</span>
        <span>${formatMoney(order.total)}</span>
      </div>
      <p class="print-footer">${escapeHtml(t('admin.invoiceThankYou'))}</p>
    </div>
  `;

  printHtml(t('admin.invoiceTitle'), body, lang, { variant: 'compact' });
}

/** Fetch approved orders and print sales + profit report. */
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

  printHtml(t('admin.printReportTitle'), body, lang);
}
