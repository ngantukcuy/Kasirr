class ProdukPage {
  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    this.page = page;
    this.searchInput = page.locator('#search-input');
    this.tableBody = page.locator('#product-tbody');
    this.btnTambah = page.getByRole('button', { name: 'Tambah Produk' });

    this.modal = page.locator('#product-modal');
    this.name = page.locator('#p-name');
    this.sku = page.locator('#p-sku');
    this.category = page.locator('#p-category');
    this.costPrice = page.locator('#p-cost');
    this.minPrice = page.locator('#p-min-price');
    this.standardPrice = page.locator('#p-std-price');
    this.stock = page.locator('#p-stock');
    this.btnSave = page.getByRole('button', { name: 'Simpan' });
    this.btnCancel = page.getByRole('button', { name: 'Batal' });
  }

  async goto() {
    await this.page.goto('/pages/produk.html');
    await this.tableBody.waitFor({ state: 'attached' });
  }

  async openAddModal() {
    await this.btnTambah.click();
    await this.modal.waitFor({ state: 'visible' });
  }

  async fillForm({ name, sku, costPrice, price, stock }) {
    if (name) await this.name.fill(name);
    if (sku) await this.sku.fill(sku);
    if (costPrice) await this.costPrice.fill(String(costPrice));
    if (price) {
      await this.minPrice.fill(String(price));
      await this.standardPrice.fill(String(price));
    }
    if (stock !== undefined) await this.stock.fill(String(stock));
  }

  async save() {
    await this.btnSave.click();
    await this.modal.waitFor({ state: 'hidden' }).catch(() => {});
  }

  async createProduct(product) {
    await this.openAddModal();
    await this.fillForm(product);
    await this.save();
  }

  rowByName(name) {
    return this.page.locator('#product-tbody tr', { hasText: name });
  }

  async search(term) {
    await this.searchInput.fill(term);
  }

  async editProductByName(name) {
    await this.rowByName(name).getByRole('button', { name: 'Edit' }).click();
    await this.modal.waitFor({ state: 'visible' });
  }
}

module.exports = { ProdukPage };
