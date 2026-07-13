const { test, expect } = require('@playwright/test');
const { ProdukPage } = require('../../pages/ProdukPage');
const { randomProduct } = require('../../utils/testData');

test.describe('Produk (SKU Master)', () => {
  test('creates a new product and shows it in the table', async ({ page }) => {
    const produkPage = new ProdukPage(page);
    const product = randomProduct();

    await produkPage.goto();
    await produkPage.createProduct(product);

    await produkPage.search(product.name);
    await expect(produkPage.rowByName(product.name)).toBeVisible();
    await expect(produkPage.rowByName(product.name)).toContainText(product.sku);
  });

  test('edits an existing product', async ({ page }) => {
    const produkPage = new ProdukPage(page);
    const product = randomProduct();
    const newStock = '99';

    await produkPage.goto();
    await produkPage.createProduct(product);
    await produkPage.search(product.name);
    await produkPage.editProductByName(product.name);

    await produkPage.stock.fill(newStock);
    await produkPage.save();

    await produkPage.search(product.name);
    await expect(produkPage.rowByName(product.name)).toContainText(newStock);
  });

  test('rejects saving a product without a required name', async ({ page }) => {
    const produkPage = new ProdukPage(page);
    await produkPage.goto();
    await produkPage.openAddModal();
    // Leave name blank, only fill secondary fields.
    await produkPage.costPrice.fill('1000');
    await produkPage.save();
    // Modal should remain open since the insert fails/validation blocks it.
    await expect(produkPage.modal).toBeVisible();
  });
});
