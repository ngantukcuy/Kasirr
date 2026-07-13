require('dotenv').config();

function env(key, fallback) {
  const v = process.env[key];
  return v === undefined || v === '' ? fallback : v;
}

const testUser = {
  name: env('TEST_NAME', 'Playwright Tester'),
  email: env('TEST_EMAIL', 'playwright.tester@example.com'),
  password: env('TEST_PASSWORD', 'TestPassword123!'),
  pin: env('TEST_PIN', '135790'),
  role: env('TEST_ROLE', 'owner'),
};

const useExistingAccount = env('USE_EXISTING_ACCOUNT', 'false') === 'true';

// Helpers to generate unique-ish data per test run so tests don't
// collide with leftover data from previous runs.
function uniqueSuffix() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

function randomProduct() {
  const suf = uniqueSuffix();
  return {
    name: `E2E Produk ${suf}`,
    sku: `E2E-${suf}`.toUpperCase(),
    costPrice: '10000',
    price: '15000',
    stock: '25',
  };
}

function randomCustomer() {
  const suf = uniqueSuffix();
  return {
    name: `E2E Pelanggan ${suf}`,
    phone: `08${Math.floor(100000000 + Math.random() * 899999999)}`,
    address: 'Jl. Testing No. 1',
  };
}

module.exports = { testUser, useExistingAccount, uniqueSuffix, randomProduct, randomCustomer };
