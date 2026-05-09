// src/utils/helpers.js
// ============================================================
// Fungsi-fungsi utilitas untuk KASIRKU
// ============================================================

/**
 * Format angka menjadi format mata uang Rupiah
 * @param {number} amount - Jumlah yang akan diformat
 * @returns {string} - Format Rupiah (contoh: Rp 1.500.000)
 */
export function formatRupiah(amount) {
  if (!amount && amount !== 0) return 'Rp 0';
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
}

/**
 * Format tanggal ke format Indonesia
 * @param {string|Date} date - Tanggal
 * @param {string} format - 'short' | 'long' | 'datetime'
 */
export function formatDate(date, format = 'short') {
  if (!date) return '-';
  const d = new Date(date);
  
  const options = {
    short: { day: '2-digit', month: '2-digit', year: 'numeric' },
    long: { day: 'long', month: 'long', year: 'numeric' },
    datetime: { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' },
    time: { hour: '2-digit', minute: '2-digit' }
  };

  return d.toLocaleDateString('id-ID', options[format] || options.short);
}

/**
 * Format nomor (misal: 1500 -> 1.500)
 */
export function formatNumber(num) {
  if (!num && num !== 0) return '0';
  return new Intl.NumberFormat('id-ID').format(num);
}

/**
 * Hitung total item di keranjang
 */
export function calculateCartTotal(items) {
  let subtotal = 0;
  let discountTotal = 0;
  let taxTotal = 0;

  items.forEach(item => {
    const itemSubtotal = item.selling_price * item.quantity;
    const itemDiscount = (itemSubtotal * (item.discount_percent || 0)) / 100;
    subtotal += itemSubtotal;
    discountTotal += itemDiscount;
  });

  const afterDiscount = subtotal - discountTotal;
  const total = afterDiscount + taxTotal;

  return {
    subtotal,
    discount: discountTotal,
    tax: taxTotal,
    total
  };
}

/**
 * Hitung poin loyalitas yang didapat dari transaksi
 * @param {number} totalAmount - Total transaksi
 * @param {string} tier - Tier pelanggan
 */
export function calculateLoyaltyPoints(totalAmount, tier = 'regular') {
  const pointsPerTier = {
    regular: 1,
    silver: 2,
    gold: 3,
    platinum: 5
  };
  const multiplier = pointsPerTier[tier] || 1;
  return Math.floor((totalAmount / 10000) * multiplier);
}

/**
 * Validasi form
 */
export function validateProduct(product) {
  const errors = {};
  if (!product.name?.trim()) errors.name = 'Nama produk wajib diisi';
  if (!product.selling_price || product.selling_price <= 0) errors.selling_price = 'Harga jual harus lebih dari 0';
  if (product.stock < 0) errors.stock = 'Stok tidak boleh negatif';
  if (!product.unit) errors.unit = 'Satuan wajib dipilih';
  return errors;
}

/**
 * Generate barcode acak (untuk produk tanpa barcode)
 */
export function generateBarcode() {
  const timestamp = Date.now().toString().slice(-8);
  const random = Math.floor(Math.random() * 9999).toString().padStart(4, '0');
  return `KB${timestamp}${random}`;
}

/**
 * Debounce function untuk search
 */
export function debounce(fn, delay = 300) {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

/**
 * Format tier badge pelanggan
 */
export function getTierBadge(tier) {
  const tiers = {
    regular: { label: 'Regular', color: '#6b7280', icon: '👤' },
    silver: { label: 'Silver', color: '#94a3b8', icon: '🥈' },
    gold: { label: 'Gold', color: '#f59e0b', icon: '🥇' },
    platinum: { label: 'Platinum', color: '#a78bfa', icon: '💎' }
  };
  return tiers[tier] || tiers.regular;
}

/**
 * Hitung persentase keuntungan
 */
export function calculateProfit(purchasePrice, sellingPrice) {
  if (!purchasePrice || purchasePrice === 0) return 0;
  return ((sellingPrice - purchasePrice) / purchasePrice * 100).toFixed(1);
}

/**
 * Export data ke CSV
 */
export function exportToCSV(data, filename) {
  if (!data || data.length === 0) return;
  
  const headers = Object.keys(data[0]).join(',');
  const rows = data.map(row => 
    Object.values(row).map(val => 
      typeof val === 'string' ? `"${val.replace(/"/g, '""')}"` : val
    ).join(',')
  );
  
  const csv = [headers, ...rows].join('\n');
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}.csv`;
  link.click();
}

/**
 * Get status badge untuk stok
 */
export function getStockStatus(stock, minStock) {
  if (stock <= 0) return { label: 'Habis', class: 'stock-empty' };
  if (stock <= minStock) return { label: 'Kritis', class: 'stock-low' };
  if (stock <= minStock * 2) return { label: 'Sedikit', class: 'stock-warning' };
  return { label: 'Tersedia', class: 'stock-ok' };
}
