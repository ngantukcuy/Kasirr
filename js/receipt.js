// js/receipt.js — Browser global script (no ES modules)
function generateReceiptHTML(transaction, storeName, storeAddress, storePhone, options) {
  options      = options || {};
  storeName    = storeName    || options.storeName    || 'Masri Jaya';
  storeAddress = storeAddress || options.storeAddress || '';
  storePhone   = storePhone   || options.storePhone   || '';
  const receiptFooter = options.receiptFooter || 'Terima kasih telah berbelanja!';
  const {
    invoice_number, created_at, payment_method,
    subtotal, discount_amount, tax_amount, total_amount,
    paid_amount, change_amount, transaction_items,
    customers, profiles
  } = transaction;
  const paymentLabels = { cash:'Tunai', transfer:'Transfer Bank', qris:'QRIS', card:'Kartu Debit/Kredit' };
  const fmt = v => typeof formatRupiah==='function' ? formatRupiah(v) : 'Rp '+Number(v||0).toLocaleString('id-ID');
  const fmtDate = v => typeof formatDate==='function' ? formatDate(v,'datetime') : new Date(v).toLocaleString('id-ID');
  const itemsHTML = (transaction_items||[]).map(item=>`
    <tr><td colspan="3" style="padding:2px 0;">${item.product_name||item.products?.name||'-'}</td></tr>
    <tr>
      <td style="padding:0 0 4px 0;">${item.quantity} ${item.unit||''}</td>
      <td style="text-align:center;">x ${fmt(item.selling_price)}</td>
      <td style="text-align:right;">${fmt(item.subtotal)}</td>
    </tr>
    ${item.discount_percent>0?`<tr><td colspan="2" style="font-size:10px;color:#888;">Diskon ${item.discount_percent}%</td><td style="text-align:right;font-size:10px;color:#e53e3e;">-${fmt(item.discount_amount)}</td></tr>`:''}
  `).join('');
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Struk - ${invoice_number}</title>
<style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:'Courier New',monospace;font-size:12px;width:80mm;margin:0 auto;padding:4mm;color:#000;background:#fff}.center{text-align:center}.line{border-top:1px dashed #333;margin:6px 0}.double-line{border-top:2px solid #333;margin:6px 0}table{width:100%;border-collapse:collapse}.store-name{font-size:18px;font-weight:bold;margin:4px 0}.total-row td{font-size:14px;font-weight:bold}.footer{margin-top:8px;font-size:10px;text-align:center}.section-label{font-size:10px;font-weight:bold;text-transform:uppercase;letter-spacing:0.5px;margin:4px 0 2px;}@media print{body{width:80mm}@page{margin:2mm;size:80mm auto}}</style>
</head><body>
<div class="center"><div class="store-name">${storeName}</div>${storeAddress?`<div>${storeAddress}</div>`:''}${storePhone?`<div>Telp: ${storePhone}</div>`:''}</div>
<div class="double-line"></div>
<table>
  <tr><td>No. Faktur</td><td style="text-align:right;">${invoice_number}</td></tr>
  <tr><td>Tanggal</td><td style="text-align:right;">${fmtDate(created_at)}</td></tr>
  <tr><td>Kasir</td><td style="text-align:right;">${profiles?.full_name||'Admin'}</td></tr>
  <tr><td>Pelanggan</td><td style="text-align:right;">${customers?customers.name:'Pelanggan Umum'}</td></tr>
</table>
<div class="line"></div>
<div class="section-label">Daftar Belanjaan</div>
<table>${itemsHTML}</table>
<div class="line"></div>
<table>
  <tr><td>Subtotal</td><td style="text-align:right;">${fmt(subtotal)}</td></tr>
  ${discount_amount>0?`<tr><td>Diskon</td><td style="text-align:right;color:#e53e3e;">-${fmt(discount_amount)}</td></tr>`:''}
  ${tax_amount>0?`<tr><td>Pajak</td><td style="text-align:right;">${fmt(tax_amount)}</td></tr>`:''}
</table>
<div class="double-line"></div>
<table>
  <tr class="total-row"><td><strong>TOTAL</strong></td><td style="text-align:right;"><strong>${fmt(total_amount)}</strong></td></tr>
  <tr><td>Bayar (${paymentLabels[payment_method]||payment_method})</td><td style="text-align:right;">${fmt(paid_amount||total_amount)}</td></tr>
  ${change_amount>0?`<tr><td><strong>Kembalian</strong></td><td style="text-align:right;"><strong>${fmt(change_amount)}</strong></td></tr>`:''}
</table>
<div class="line"></div>
<div class="footer"><p>${receiptFooter}</p><p>Barang yang sudah dibeli tidak dapat dikembalikan</p><p>kecuali ada kesepakatan bersama.</p><br><p>===== Powered by KASIRKU =====</p></div>
</body></html>`;
}

function printReceipt(transaction, storeInfo) {
  storeInfo = storeInfo || {};
  const html = generateReceiptHTML(
    transaction,
    storeInfo.store_name,
    storeInfo.store_address,
    storeInfo.store_phone,
    { receiptFooter: storeInfo.receipt_footer }
  );
  const w = window.open('','_blank','width=420,height=650');
  if (!w) { alert('Pop-up diblokir browser. Izinkan pop-up untuk mencetak struk.'); return; }
  w.document.open(); w.document.write(html); w.document.close(); w.focus();
  setTimeout(() => { w.print(); }, 600);
}

// ── Cetak Pesanan (tanpa harga, tampilkan alamat pelanggan) ──────────
function generateOrderSlipHTML(transaction, storeName, storeAddress, storePhone) {
  storeName    = storeName    || 'Masri Jaya';
  storeAddress = storeAddress || '';
  storePhone   = storePhone   || '';
  const {
    invoice_number, created_at,
    transaction_items, customers, profiles, notes
  } = transaction;
  const fmtDate = v => typeof formatDate==='function' ? formatDate(v,'datetime') : new Date(v).toLocaleString('id-ID');
  const itemsHTML = (transaction_items||[]).map((item, idx) => `
    <tr>
      <td style="padding:4px 0; vertical-align:top;">${idx+1}.</td>
      <td style="padding:4px 6px; vertical-align:top;"><strong>${item.product_name||item.products?.name||'-'}</strong></td>
      <td style="padding:4px 0; text-align:right; vertical-align:top; white-space:nowrap;"><strong>${item.quantity} ${item.unit||'pcs'}</strong></td>
    </tr>
    ${item.notes ? `<tr><td></td><td colspan="2" style="font-size:10px;color:#555;padding:0 6px 4px;">↳ ${item.notes}</td></tr>` : ''}
  `).join('');

  const customerSection = customers ? `
    <div style="margin:8px 0; padding:8px; border:1px solid #ccc; border-radius:4px;">
      <div style="font-size:11px; font-weight:bold; margin-bottom:4px; text-transform:uppercase; letter-spacing:0.5px;">DATA PELANGGAN</div>
      <table style="width:100%; border-collapse:collapse; font-size:12px;">
        <tr><td style="padding:1px 0; width:40%;">Nama</td><td>: <strong>${customers.name}</strong></td></tr>
        ${customers.phone ? `<tr><td style="padding:1px 0;">No. HP</td><td>: ${customers.phone}</td></tr>` : ''}
        ${customers.address ? `<tr><td style="padding:1px 0; vertical-align:top;">Alamat</td><td style="vertical-align:top;">: ${customers.address}</td></tr>` : ''}
      </table>
    </div>` : `
    <div style="margin:8px 0; padding:8px; border:1px dashed #ccc; border-radius:4px; text-align:center; font-size:11px; color:#888;">
      Pelanggan Umum
    </div>`;

  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Pesanan - ${invoice_number}</title>
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:'Courier New',monospace;font-size:12px;width:80mm;margin:0 auto;padding:4mm;color:#000;background:#fff}
  .center{text-align:center}
  .line{border-top:1px dashed #333;margin:6px 0}
  .double-line{border-top:2px solid #333;margin:6px 0}
  table{width:100%;border-collapse:collapse}
  .store-name{font-size:16px;font-weight:bold;margin:4px 0}
  .order-label{font-size:20px;font-weight:bold;text-align:center;letter-spacing:2px;margin:6px 0;padding:4px;}
  @media print{body{width:80mm}@page{margin:2mm;size:80mm auto}}
</style>
</head><body>
<div class="center">
  <div class="order-label">PESANAN</div>
  <div class="store-name">${storeName}</div>
  ${storeAddress?`<div>${storeAddress}</div>`:''}
  ${storePhone?`<div>Telp: ${storePhone}</div>`:''}
</div>
<div class="double-line"></div>
<table>
  <tr><td>No. Pesanan</td><td style="text-align:right;"><strong>${invoice_number}</strong></td></tr>
  <tr><td>Tanggal</td><td style="text-align:right;">${fmtDate(created_at)}</td></tr>
  <tr><td>Kasir</td><td style="text-align:right;">${profiles?.full_name||'Admin'}</td></tr>
</table>
${customerSection}
<div class="line"></div>
<div style="font-size:11px; font-weight:bold; margin-bottom:4px; text-transform:uppercase; letter-spacing:0.5px;">DAFTAR PESANAN</div>
<table>${itemsHTML}</table>
<div class="double-line"></div>
<div style="font-size:11px; font-weight:bold;">Total Item: ${(transaction_items||[]).reduce((s,i)=>s+(i.quantity||0),0)} pcs</div>
${notes ? `<div class="line"></div><div style="font-size:11px;"><strong>Catatan:</strong> ${notes}</div>` : ''}
<div class="line"></div>
<div class="center" style="font-size:10px; margin-top:4px;">
  <p>Slip Pesanan — Bukan Bukti Pembayaran</p>
  <p>===== KASIRKU =====</p>
</div>
</body></html>`;
}

function printOrderSlip(transaction, storeInfo) {
  storeInfo = storeInfo || {};
  const html = generateOrderSlipHTML(transaction, storeInfo.store_name, storeInfo.store_address, storeInfo.store_phone);
  const w = window.open('','_blank','width=420,height=650');
  if (!w) { alert('Pop-up diblokir browser. Izinkan pop-up untuk mencetak.'); return; }
  w.document.open(); w.document.write(html); w.document.close(); w.focus();
  setTimeout(() => { w.print(); }, 600);
}

function downloadReceipt(transaction, storeInfo) {
  storeInfo = storeInfo || {};
  const html = generateReceiptHTML(transaction, storeInfo.store_name, storeInfo.store_address, storeInfo.store_phone);
  const blob = new Blob([html], {type:'text/html;charset=utf-8'});
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `Struk-${transaction.invoice_number}.html`;
  link.click();
}
