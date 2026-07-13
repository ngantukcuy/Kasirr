class DashboardPage {
  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    this.page = page;
    this.statRevenue = page.locator('#stat-revenue');
    this.statTransactions = page.locator('#stat-transactions');
    this.statProducts = page.locator('#stat-products');
    this.statLowStock = page.locator('#stat-low-stock');
    this.salesChart = page.locator('#salesChart');
    this.lowStockList = page.locator('#low-stock-list');
    this.recentTxBody = page.locator('#recent-tx-body');
  }

  async goto() {
    await this.page.goto('/pages/dashboard.html');
    await this.statRevenue.waitFor({ state: 'attached' });
  }
}

module.exports = { DashboardPage };
