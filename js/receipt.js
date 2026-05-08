// src/utils/receipt.js
// ============================================================
// Utilitas Pencetakan Struk untuk KASIRKU
// Mendukung: Cetak Digital (Browser Print) & Thermal Printer
// ============================================================

import { formatRupiah, formatDate } from './helpers.js';

/**
 * Generate HTML struk untuk dicetak atau ditampilkan
 */
export function generateReceiptHTML(transaction, storeName = 'Toko Bangunan', storeAddress = '', storePhone = '') {
  const { 
    invoice_number, created_at, payment_method, 
    subtotal, discount_amount, tax_amount, total_amount, 
    paid_amount, change_amount, transaction_items,
    customers, profiles
  } = transaction;

  const paymentLabels = {
    cash: 'Tunai', transfer: 'Transfer Bank', 
    qris: 'QRIS', card: 'Kartu Debit/Kredit'
  };

  const itemsHTML = (transaction_items || []).map(item => `
    <tr>
      <td colspan="3" style="padding: 2px 0;">${item.product_name}</td>
    </tr>
    <tr>
      <td style="padding: 0 0 4px 0;">${item.quantity} ${item.unit}</td>
      <td style="text-align:center;">x ${formatRupiah(item.selling_price)}</td>
      <td style="text-align:right;">${formatRupiah(item.subtotal)}</td>
    </tr>
    ${item.discount_percent > 0 ? `
    <tr>
      <td colspan="2" style="font-size:10px; color:#888;">Diskon ${item.discount_percent}%</td>
      <td style="text-align:right; font-size:10px; color:#e53e3e;">-${formatRupiah(item.discount_amount)}</td>
    </tr>` : ''}
  `).join('');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Struk - ${invoice_number}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: 'Courier New', Courier, monospace;
          font-size: 12px;
          width: 80mm;
          margin: 0 auto;
          padding: 4mm;
          color: #000;
          background: #fff;
        }
        .center { text-align: center; }
        .bold { font-weight: bold; }
        .line { border-top: 1px dashed #333; margin: 6px 0; }
        .double-line { border-top: 2px solid #333; margin: 6px 0; }
        table { width: 100%; border-collapse: collapse; }
        .store-name { font-size: 18px; font-weight: bold; margin: 4px 0; }
        .total-row td { font-size: 14px; font-weight: bold; }
        .footer { margin-top: 8px; font-size: 10px; text-align: center; }
        @media print {
          body { width: 80mm; }
          @page { margin: 2mm; size: 80mm auto; }
        }
      </style>
    </head>
    <body>
      <!-- Header Toko -->
      <div class="center">
        <div class="store-name">${storeName}</div>
        ${storeAddress ? `<div>${storeAddress}</div>` : ''}
        ${storePhone ? `<div>Telp: ${storePhone}</div>` : ''}
      </div>
      
      <div class="double-line"></div>
      
      <!-- Info Transaksi -->
      <table>
        <tr>
          <td>No. Faktur</td>
          <td style="text-align:right;">${invoice_number}</td>
        </tr>
        <tr>
          <td>Tanggal</td>
          <td style="text-align:right;">${formatDate(created_at, 'datetime')}</td>
        </tr>
        <tr>
          <td>Kasir</td>
          <td style="text-align:right;">${profiles?.full_name || 'Admin'}</td>
        </tr>
        ${customers ? `
        <tr>
          <td>Pelanggan</td>
          <td style="text-align:right;">${customers.name}</td>
        </tr>` : ''}
      </table>
      
      <div class="line"></div>
      
      <!-- Items -->
      <table>${itemsHTML}</table>
      
      <div class="line"></div>
      
      <!-- Totals -->
      <table>
        <tr>
          <td>Subtotal</td>
          <td style="text-align:right;">${formatRupiah(subtotal)}</td>
        </tr>
        ${discount_amount > 0 ? `
        <tr>
          <td>Diskon</td>
          <td style="text-align:right; color:#e53e3e;">-${formatRupiah(discount_amount)}</td>
        </tr>` : ''}
        ${tax_amount > 0 ? `
        <tr>
          <td>Pajak</td>
          <td style="text-align:right;">${formatRupiah(tax_amount)}</td>
        </tr>` : ''}
      </table>
      
      <div class="double-line"></div>
      
      <table>
        <tr class="total-row">
          <td><strong>TOTAL</strong></td>
          <td style="text-align:right;"><strong>${formatRupiah(total_amount)}</strong></td>
        </tr>
        <tr>
          <td>Bayar (${paymentLabels[payment_method] || payment_method})</td>
          <td style="text-align:right;">${formatRupiah(paid_amount)}</td>
        </tr>
        ${change_amount > 0 ? `
        <tr>
          <td><strong>Kembalian</strong></td>
          <td style="text-align:right;"><strong>${formatRupiah(change_amount)}</strong></td>
        </tr>` : ''}
      </table>
      
      <div class="line"></div>
      
      <!-- Footer -->
      <div class="footer">
        <p>Terima kasih telah berbelanja!</p>
        <p>Barang yang sudah dibeli tidak dapat dikembalikan</p>
        <p>kecuali ada kesepakatan bersama.</p>
        <br>
        <p>===== Powered by KASIRKU =====</p>
      </div>
    </body>
    </html>
  `;
}

/**
 * Cetak struk menggunakan window.print()
 */
export function printReceipt(transaction, storeInfo = {}) {
  const html = generateReceiptHTML(
    transaction,
    storeInfo.store_name,
    storeInfo.store_address,
    storeInfo.store_phone
  );
  
  const printWindow = window.open('', '_blank', 'width=400,height=600');
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.focus();
  
  setTimeout(() => {
    printWindow.print();
    printWindow.close();
  }, 500);
}

/**
 * Download struk sebagai file HTML
 */
export function downloadReceipt(transaction, storeInfo = {}) {
  const html = generateReceiptHTML(
    transaction,
    storeInfo.store_name,
    storeInfo.store_address,
    storeInfo.store_phone
  );
  
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `Struk-${transaction.invoice_number}.html`;
  link.click();
}

/**
 * Share struk via Web Share API (mobile)
 */
export async function shareReceipt(transaction) {
  if (!navigator.share) return false;
  
  const text = `
STRUK PEMBELIAN - ${transaction.invoice_number}
Total: ${formatRupiah(transaction.total_amount)}
Tanggal: ${formatDate(transaction.created_at, 'datetime')}
Terima kasih telah berbelanja!
  `.trim();
  
  try {
    await navigator.share({ title: 'Struk Pembelian', text });
    return true;
  } catch {
    return false;
  }
}
