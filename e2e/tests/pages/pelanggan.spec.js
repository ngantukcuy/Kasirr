const { test, expect } = require('@playwright/test');
const { PelangganPage } = require('../../pages/PelangganPage');
const { randomCustomer } = require('../../utils/testData');

test.describe('Pelanggan (Customers)', () => {
  test('creates a new customer and finds it via search', async ({ page }) => {
    const pelangganPage = new PelangganPage(page);
    const customer = randomCustomer();

    await pelangganPage.goto();
    await pelangganPage.createCustomer(customer);

    await pelangganPage.search(customer.name);
    await expect(pelangganPage.rowByName(customer.name)).toBeVisible();
    await expect(pelangganPage.rowByName(customer.name)).toContainText(customer.phone);
  });

  test('filters customers by type', async ({ page }) => {
    const pelangganPage = new PelangganPage(page);
    const customer = randomCustomer();

    await pelangganPage.goto();
    await pelangganPage.createCustomer({ ...customer, type: 'toko' });

    await pelangganPage.typeFilter.selectOption('toko');
    await pelangganPage.search(customer.name);
    await expect(pelangganPage.rowByName(customer.name)).toBeVisible();

    await pelangganPage.typeFilter.selectOption('perusahaan');
    await expect(pelangganPage.rowByName(customer.name)).toHaveCount(0);
  });
});
