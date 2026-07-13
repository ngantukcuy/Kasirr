class KasirPage {
  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    this.page = page;
    this.productSearch = page.locator('#product-search');
    this.productsGrid = page.locator('#products-grid');
    this.productCards = page.locator('.product-card');

    this.cartList = page.locator('#cart-list');
    this.cartCount = page.locator('#cart-count');
    this.sumSubtotal = page.locator('#sum-subtotal');
    this.sumTotal = page.locator('#sum-total');
    this.btnCheckout = page.locator('#btn-checkout');

    this.paymentModal = page.locator('#payment-modal');
    this.payTotal = page.locator('#pay-total');
    this.btnQuickExact = page.getByRole('button', { name: 'Pas' });
    this.changeAmount = page.locator('#change-amount');
    this.btnConfirmPayment = page.locator('#btn-confirm-payment');
    this.successModal = page.locator('#success-modal');
  }

  async goto() {
    await this.page.goto('/pages/kasir.html');
    await this.productsGrid.waitFor({ state: 'attached' });
  }

  async searchProduct(term) {
    await this.productSearch.fill(term);
    await this.page.waitForTimeout(400); // debounced search (250ms) in app
  }

  async addFirstResultToCart() {
    await this.productCards.first().waitFor({ state: 'visible' });
    await this.productCards.first().click();
  }

  async addProductToCartByName(name) {
    await this.searchProduct(name);
    await this.productCards.filter({ hasText: name }).first().click();
  }

  async openCheckout() {
    await this.btnCheckout.click();
    await this.paymentModal.waitFor({ state: 'visible' });
  }

  async payExactCash() {
    await this.btnQuickExact.click();
    await this.btnConfirmPayment.click();
  }
}

module.exports = { KasirPage };
