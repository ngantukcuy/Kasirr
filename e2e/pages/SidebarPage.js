/**
 * Wraps the shared sidebar (pages/_sidebar.js) that is injected on
 * every authenticated page of the app.
 */
class SidebarPage {
  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    this.page = page;
    this.sidebar = page.locator('#sidebar');
    this.userName = page.locator('#user-name');
    this.userRole = page.locator('#user-role');
  }

  navItem(label) {
    return this.page.locator('.nav-item', { hasText: label });
  }

  async goTo(label) {
    await this.navItem(label).first().click();
  }

  async logout() {
    // Sidebar exposes a logout action (button/link) that calls
    // KasirkuDB.Auth.logout(); fall back to calling it directly
    // via page.evaluate if no visible control is found.
    const logoutBtn = this.page.locator('[onclick*="logout"], .btn-logout, #btn-logout');
    if (await logoutBtn.first().isVisible().catch(() => false)) {
      await logoutBtn.first().click();
    } else {
      await this.page.evaluate(() => window.KasirkuDB?.Auth?.logout?.());
    }
  }
}

module.exports = { SidebarPage };
