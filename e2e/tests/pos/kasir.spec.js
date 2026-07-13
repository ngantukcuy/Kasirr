const { test, expect } = require('@playwright/test');
const { KasirPage } = require('../../pages/KasirPage');
const { ProdukPage } = require('../../pages/ProdukPage');
const { randomProduct } = require('../../utils/testData');

test.describe('Kasir / POS', () => {
  test('completes a cash sale from product search to payment confirmation', async ({ page }) => {
    // Seed a known product with predictable stock/price so the cart math
    // in this test is deterministic regardless of existing catalog data.
    const produkPage = new ProdukPage(page);
    const product = randomProduct();
    await produkPage.goto();
    await produkPage.createProduct(product);

    const kasirPage = new KasirPage(page);
    await kasirPage.goto();

    await kasirPage.addProductToCartByName(product.name);
    await expect(kasirPage.cartList).toContainText(product.name);
    await expect(kasirPage.btnCheckout).toBeEnabled();

    await kasirPage.openCheckout();
    await kasirPage.payExactCash();

    await expect(kasirPage.successModal).toBeVisible({ timeout: 8000 });
  });

  test('product search filters the POS grid', async ({ page }) => {
    const produkPage = new ProdukPage(page);
    const product = randomProduct();
    await produkPage.goto();
    await produkPage.createProduct(product);

    const kasirPage = new KasirPage(page);
    await kasirPage.goto();
    await kasirPage.searchProduct(product.name);

    await expect(kasirPage.productCards).toHaveCount(1);
    await expect(kasirPage.productCards.first()).toContainText(product.name);
  });
});
