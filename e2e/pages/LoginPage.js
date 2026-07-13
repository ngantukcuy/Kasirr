class LoginPage {
  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    this.page = page;

    this.loginView = page.locator('#view-login');
    this.loginEmptyState = page.locator('#login-empty');
    this.loginMain = page.locator('#login-main');

    this.accountTrigger = page.locator('#account-trigger');
    this.accountDropdown = page.locator('#account-dropdown');
    this.accountDropdownItems = page.locator('.dropdown-account-item');

    this.pinSection = page.locator('#pin-section');
    this.pinDigits = page.locator('#pin-grid .pin-dot');
    this.btnPinLogin = page.locator('#btn-pin-login');

    this.noPinNotice = page.locator('#no-pin-notice');
    this.btnDirectLogin = page.locator('#btn-direct-login');

    this.btnAddAccount = page.locator('#btn-add-account');
    this.registerLink = page.locator('[data-switch="register"]');

    this.toastContainer = page.locator('#toast-container');
  }

  async goto() {
    await this.page.goto('/index.html');
    await this.loginView.waitFor({ state: 'visible' });
  }

  async hasSavedAccounts() {
    return await this.loginMain.isVisible();
  }

  async selectAccountByEmail(email) {
    await this.accountTrigger.click();
    await this.accountDropdown.waitFor({ state: 'visible' });
    await this.page.locator('.dropdown-account-item', { hasText: email }).click();
  }

  async enterPin(pin) {
    const digits = pin.split('');
    for (let i = 0; i < digits.length; i++) {
      await this.pinDigits.nth(i).fill(digits[i]);
    }
  }

  async loginWithPin(email, pin) {
    await this.selectAccountByEmail(email);
    await this.pinSection.waitFor({ state: 'visible' });
    await this.enterPin(pin);
    await this.btnPinLogin.click();
  }

  async loginDirect(email) {
    await this.selectAccountByEmail(email);
    await this.noPinNotice.waitFor({ state: 'visible' });
    await this.btnDirectLogin.click();
  }

  async waitForToast(textFragment, opts = {}) {
    return this.page.locator('#toast-container').getByText(textFragment, { exact: false }).waitFor({
      state: 'visible',
      timeout: opts.timeout || 5000,
    });
  }

  async goToRegister() {
    if (await this.registerLink.isVisible().catch(() => false)) {
      await this.registerLink.click();
    } else {
      await this.btnAddAccount.click();
    }
  }
}

module.exports = { LoginPage };
