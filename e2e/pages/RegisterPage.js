class RegisterPage {
  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    this.page = page;

    this.view = page.locator('#view-register');
    this.name = page.locator('#reg-name');
    this.email = page.locator('#reg-email');
    this.password = page.locator('#reg-password');
    this.password2 = page.locator('#reg-password2');
    this.pinDigits = page.locator('#reg-pin-grid .pin-dot');
    this.pinConfirmDigits = page.locator('#reg-pin-confirm-grid .pin-dot');
    this.role = page.locator('#reg-role');
    this.btnRegister = page.locator('#btn-register');
    this.switchToLoginLink = page.locator('[data-switch="login"]');
  }

  async waitForVisible() {
    await this.view.waitFor({ state: 'visible' });
  }

  async fillPin(locator, pin) {
    const digits = pin.split('');
    for (let i = 0; i < digits.length; i++) {
      await locator.nth(i).fill(digits[i]);
    }
  }

  async register({ name, email, password, pin, role }) {
    await this.waitForVisible();
    await this.name.fill(name);
    await this.email.fill(email);
    await this.password.fill(password);
    await this.password2.fill(password);
    await this.fillPin(this.pinDigits, pin);
    await this.fillPin(this.pinConfirmDigits, pin);
    if (role) await this.role.selectOption(role);
    await this.btnRegister.click();
  }
}

module.exports = { RegisterPage };
