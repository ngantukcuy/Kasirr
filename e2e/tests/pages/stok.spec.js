const { test, expect } = require('@playwright/test');
const { StokPage } = require('../../pages/StokPage');
const { ProdukPage } = require('../../pages/ProdukPage');
const { randomProduct } = require('../../utils/testData');

test.describe('Stok (Inventory)', () => {
  test('switches between all / low-stock / empty-stock tabs', async ({ page }) => {
    const stokPage = new StokPage(page);
    await stokPage.goto();

    await stokPage.tabLow.click();
    await expect(stokPage.tabLow).toHaveClass(/active/);

    await stokPage.tabEmpty.click();
    await expect(stokPage.tabEmpty).toHaveClass(/active/);

    await stokPage.tabAll.click();
    await expect(stokPage.tabAll).toHaveClass(/active/);
  });

  test('records a stock-in adjustment for a product', async ({ page }) => {
    // Seed a fresh product first so the adjustment target is predictable.
    const produkPage = new ProdukPage(page);
    const product = randomProduct();
    await produkPage.goto();
    await produkPage.createProduct(product);

    const stokPage = new StokPage(page);
    await stokPage.goto();
    await stokPage.openAdjustModalFor(product.name);
    await stokPage.adjustStock({ type: 'in', qty: 5, notes: 'E2E stock-in test' });

    await expect(stokPage.adjustModal).toBeHidden();
  });
});
