const { test, expect } = require('@playwright/test');
const { LoginPage } = require('../../pages/LoginPage');

/**
 * These tests exercise the login screen's client-side behaviour only
 * (account picker, PIN grid, validation). They seed a fake "saved
 * account" straight into localStorage so they don't depend on a real
 * Supabase account existing / being confirmed.
 */
const FAKE_ACCOUNT = {
  name: 'Fake Seeded User',
  email: 'fake.seeded.user@example.com',
  // hashPin('000000', email) computed with the app's own hashPin() algorithm
  pinHash: null, // computed at runtime in the test via page.evaluate
  encPwd: null,
  role: 'kasir',
  addedAt: Date.now(),
};

async function seedAccount(page) {
  await page.addInitScript((account) => {
    // Re-implement the app's hashPin() so the seeded record validates
    // correctly against the PIN "000000" typed in the test.
    function hashPin(pin, email) {
      let h = 0;
      const str = pin + email + 'tokku_salt_2025';
      for (let i = 0; i < str.length; i++) { h = (Math.imul(31, h) + str.charCodeAt(i)) | 0; }
      return h.toString(36);
    }
    account.pinHash = hashPin('000000', account.email);
    localStorage.setItem('tokku_saved_accounts', JSON.stringify([account]));
  }, FAKE_ACCOUNT);
}

test.describe('Login screen', () => {
  test('shows the empty state when no account is saved on this device', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await expect(loginPage.loginEmptyState).toBeVisible();
    await expect(loginPage.loginMain).toBeHidden();
  });

  test('lets a visitor reach the registration form from the empty state', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await page.locator('[data-switch="register"]').click();
    await expect(page.locator('#view-register')).toBeVisible();
  });

  test('shows the PIN entry once a saved account is selected', async ({ page }) => {
    await seedAccount(page);
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await expect(loginPage.loginMain).toBeVisible();
    await loginPage.selectAccountByEmail(FAKE_ACCOUNT.email);
    await expect(loginPage.pinSection).toBeVisible();
  });

  test('rejects an incorrect PIN with an error toast', async ({ page }) => {
    await seedAccount(page);
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.selectAccountByEmail(FAKE_ACCOUNT.email);
    await loginPage.enterPin('999999');
    await loginPage.btnPinLogin.click();
    await expect(page.locator('#toast-container')).toContainText('PIN salah');
  });
});
