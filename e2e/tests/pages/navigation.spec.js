const { test, expect } = require('@playwright/test');
const { DashboardPage } = require('../../pages/DashboardPage');
const { SidebarPage } = require('../../pages/SidebarPage');
const { testUser } = require('../../utils/testData');

test.describe('Authenticated navigation', () => {
  test('lands on the dashboard with the sidebar showing the logged-in user', async ({ page }) => {
    const dashboard = new DashboardPage(page);
    await dashboard.goto();
    const sidebar = new SidebarPage(page);
    await expect(sidebar.userName).toContainText(testUser.name.split(' ')[0]);
  });

  const targets = [
    { label: '4. Stok', heading: 'Monitor Stok' },
    { label: 'SKU Master', heading: 'SKU Master' },
    { label: '7. Relasi', heading: 'Pelanggan' },
    { label: '3. Riwayat Transaksi', heading: 'Riwayat Transaksi' },
    { label: 'Kasir / POS', heading: 'Kasir / POS' },
  ];

  for (const { label, heading } of targets) {
    test(`navigates to "${label}" via the sidebar`, async ({ page }) => {
      const dashboard = new DashboardPage(page);
      await dashboard.goto();
      const sidebar = new SidebarPage(page);
      await sidebar.goTo(label);
      await expect(page.locator('h1')).toContainText(heading);
    });
  }

  test('redirects unauthenticated visitors away from protected pages', async ({ browser }) => {
    // Fresh, un-authenticated context (ignores the shared storageState).
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto('/pages/dashboard.html');
    await page.waitForURL('**/index.html', { timeout: 8000 });
    await expect(page.locator('#view-login')).toBeVisible();
    await context.close();
  });

  test('logs out back to the login screen', async ({ page }) => {
    const dashboard = new DashboardPage(page);
    await dashboard.goto();
    const sidebar = new SidebarPage(page);
    await sidebar.logout();
    await page.waitForURL('**/index.html');
    await expect(page.locator('#view-login')).toBeVisible();
  });
});
