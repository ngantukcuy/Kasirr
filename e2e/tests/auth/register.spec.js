const { test, expect } = require('@playwright/test');
const { LoginPage } = require('../../pages/LoginPage');
const { RegisterPage } = require('../../pages/RegisterPage');
const { testUser, uniqueSuffix } = require('../../utils/testData');

test.describe('Registration form', () => {
  test.beforeEach(async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.goToRegister();
  });

  test('rejects submission when required fields are empty', async ({ page }) => {
    const registerPage = new RegisterPage(page);
    await registerPage.waitForVisible();
    await registerPage.btnRegister.click();
    await expect(page.locator('#toast-container')).toContainText('wajib diisi');
  });

  test('rejects a password shorter than 8 characters', async ({ page }) => {
    const registerPage = new RegisterPage(page);
    const suf = uniqueSuffix();
    await registerPage.name.fill('Test Short Password');
    await registerPage.email.fill(`shortpwd.${suf}@example.com`);
    await registerPage.password.fill('abc123');
    await registerPage.password2.fill('abc123');
    await registerPage.fillPin(registerPage.pinDigits, '111111');
    await registerPage.fillPin(registerPage.pinConfirmDigits, '111111');
    await registerPage.btnRegister.click();
    await expect(page.locator('#toast-container')).toContainText('minimal 8 karakter');
  });

  test('shows a live mismatch message when passwords differ', async ({ page }) => {
    const registerPage = new RegisterPage(page);
    await registerPage.password.fill('CorrectPass123');
    await registerPage.password2.fill('DifferentPass123');
    await expect(page.locator('#pwd-match-msg')).toContainText('tidak sama');
  });

  test('shows a live mismatch message when PIN confirmation differs', async ({ page }) => {
    const registerPage = new RegisterPage(page);
    await registerPage.fillPin(registerPage.pinDigits, '123456');
    await registerPage.fillPin(registerPage.pinConfirmDigits, '654321');
    await expect(page.locator('#pin-match-msg')).toContainText('tidak sama');
  });

  test('submits successfully with valid data (idempotent for shared test user)', async ({ page }) => {
    const registerPage = new RegisterPage(page);
    await registerPage.register(testUser);
    // Either a fresh-signup success toast, or the "already registered ->
    // linked to this device" toast, both indicate the request reached
    // Supabase successfully and was handled without a hard error.
    await expect(page.locator('#toast-container')).toContainText(/berhasil|ditautkan/i, { timeout: 8000 });
  });
});
