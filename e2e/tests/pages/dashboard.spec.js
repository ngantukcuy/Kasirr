const { test, expect } = require('@playwright/test');
const { DashboardPage } = require('../../pages/DashboardPage');

test.describe('Dashboard', () => {
  test('renders the key summary stats and sales chart', async ({ page }) => {
    const dashboard = new DashboardPage(page);
    await dashboard.goto();

    await expect(dashboard.statRevenue).toBeVisible();
    await expect(dashboard.statTransactions).toBeVisible();
    await expect(dashboard.statProducts).toBeVisible();
    await expect(dashboard.statLowStock).toBeVisible();

    // Stats are populated asynchronously from Supabase; make sure they
    // move past the initial loading placeholder.
    await expect(dashboard.statRevenue).not.toHaveText('', { timeout: 8000 });
    await expect(dashboard.salesChart).toBeVisible();
  });
});
