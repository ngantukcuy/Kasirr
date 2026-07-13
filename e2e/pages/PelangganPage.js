class PelangganPage {
  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    this.page = page;
    this.searchInput = page.locator('#search-input');
    this.typeFilter = page.locator('#f-type');
    this.tableBody = page.locator('#customer-tbody');
    this.btnTambah = page.getByRole('button', { name: 'Tambah Pelanggan' });

    this.modal = page.locator('#customer-modal');
    this.name = page.locator('#c-name');
    this.phone = page.locator('#c-phone');
    this.type = page.locator('#c-type');
    this.address = page.locator('#c-address');
    this.debtLimit = page.locator('#c-debt-limit');
    this.paymentTerm = page.locator('#c-payment-term');
    this.notes = page.locator('#c-notes');
    this.btnSave = page.locator('#btn-save');
  }

  async goto() {
    await this.page.goto('/pages/pelanggan.html');
    await this.tableBody.waitFor({ state: 'attached' });
  }

  async openAddModal() {
    await this.btnTambah.click();
    await this.modal.waitFor({ state: 'visible' });
  }

  async fillForm({ name, phone, address, type }) {
    if (name) await this.name.fill(name);
    if (phone) await this.phone.fill(phone);
    if (address) await this.address.fill(address);
    if (type) await this.type.selectOption(type);
  }

  async save() {
    await this.btnSave.click();
    await this.modal.waitFor({ state: 'hidden' }).catch(() => {});
  }

  async createCustomer(customer) {
    await this.openAddModal();
    await this.fillForm(customer);
    await this.save();
  }

  rowByName(name) {
    return this.page.locator('#customer-tbody tr', { hasText: name });
  }

  async search(term) {
    await this.searchInput.fill(term);
    await this.page.waitForTimeout(450); // debounced search (350ms) in app
  }
}

module.exports = { PelangganPage };
