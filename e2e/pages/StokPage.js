class StokPage {
  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    this.page = page;
    this.tabAll = page.locator('#tab-all');
    this.tabLow = page.locator('#tab-low');
    this.tabEmpty = page.locator('#tab-empty');
    this.tableBody = page.locator('#stok-tbody');
    this.cardList = page.locator('#stok-cardlist');
    this.btnPenyesuaian = page.getByRole('button', { name: 'Penyesuaian Stok' });

    this.adjustModal = page.locator('#adjust-modal');
    this.productSelect = page.locator('#adj-product');
    this.typeInLabel = page.locator('#type-in-label');
    this.typeOutLabel = page.locator('#type-out-label');
    this.qty = page.locator('#adj-qty');
    this.notes = page.locator('#adj-notes');
    this.btnSave = page.locator('#btn-adj');
  }

  async goto() {
    await this.page.goto('/pages/stok.html');
    await this.tableBody.waitFor({ state: 'attached' });
  }

  async openAdjustModalFor(productName) {
    // "Penyesuaian Stok" is a single header-level button (not per-row);
    // the product itself is chosen from the dropdown inside the modal.
    await this.btnPenyesuaian.click();
    await this.adjustModal.waitFor({ state: 'visible' });
    if (productName) {
      await this.productSelect.selectOption({ label: productName }).catch(() => {});
    }
  }

  async adjustStock({ type = 'in', qty, notes }) {
    if (type === 'out') await this.typeOutLabel.click();
    else await this.typeInLabel.click();
    await this.qty.fill(String(qty));
    if (notes) await this.notes.fill(notes);
    await this.btnSave.click();
    await this.adjustModal.waitFor({ state: 'hidden' }).catch(() => {});
  }
}

module.exports = { StokPage };
