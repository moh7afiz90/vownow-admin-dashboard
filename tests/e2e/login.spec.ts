import { test, expect, Page } from '@playwright/test';

test.describe('T031: Admin Login Flow with 2FA', () => {
  let page: Page;

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();
    // Clear any existing auth state
    await page.context().clearCookies();
    await page.context().clearPermissions();
  });

  test.afterEach(async () => {
    await page.close();
  });

  test('should redirect unauthenticated users to login page', async () => {
    // ARRANGE: Navigate to protected dashboard
    await page.goto('/admin/dashboard');

    // ASSERT: Should redirect to login
    await expect(page).toHaveURL(/.*\/admin\/login/);
    await expect(page.getByTestId('admin-login-form')).toBeVisible();
  });

  test('should show validation errors for invalid credentials', async () => {
    // ARRANGE: Navigate to login page
    await page.goto('/admin/login');

    // ACT: Submit form with invalid credentials
    await page.getByTestId('email-input').fill('invalid@example.com');
    await page.getByTestId('password-input').fill('wrongpassword');
    await page.getByTestId('login-submit-button').click();

    // ASSERT: Should show error message
    await expect(page.getByTestId('login-error-message')).toBeVisible();
    await expect(page.getByTestId('login-error-message')).toContainText('Invalid credentials');
  });

  test('should complete full 2FA login flow for valid admin user', async () => {
    // ARRANGE: Navigate to login page
    await page.goto('/admin/login');

    // ACT: Enter valid admin credentials
    await page.getByTestId('email-input').fill('admin@vownow.com');
    await page.getByTestId('password-input').fill('admin123');
    await page.getByTestId('login-submit-button').click();

    // ASSERT: Should redirect to 2FA verification
    await expect(page).toHaveURL(/.*\/admin\/verify-2fa/);
    await expect(page.getByTestId('2fa-verification-form')).toBeVisible();

    // ACT: Enter valid 2FA code
    await page.getByTestId('2fa-code-input').fill('123456');
    await page.getByTestId('verify-2fa-button').click();

    // ASSERT: Should redirect to dashboard
    await expect(page).toHaveURL('/admin/dashboard');
    await expect(page.getByTestId('admin-dashboard')).toBeVisible();
    await expect(page.getByTestId('admin-user-menu')).toBeVisible();
  });

  test('should reject invalid 2FA codes', async () => {
    // ARRANGE: Complete first step of login
    await page.goto('/admin/login');
    await page.getByTestId('email-input').fill('admin@vownow.com');
    await page.getByTestId('password-input').fill('admin123');
    await page.getByTestId('login-submit-button').click();
    await expect(page).toHaveURL(/.*\/admin\/verify-2fa/);

    // ACT: Enter invalid 2FA code
    await page.getByTestId('2fa-code-input').fill('000000');
    await page.getByTestId('verify-2fa-button').click();

    // ASSERT: Should show 2FA error
    await expect(page.getByTestId('2fa-error-message')).toBeVisible();
    await expect(page.getByTestId('2fa-error-message')).toContainText('Invalid verification code');
    await expect(page).toHaveURL(/.*\/admin\/verify-2fa/);
  });

  test('should handle session persistence across browser tabs', async () => {
    // ARRANGE: Login in first tab
    await page.goto('/admin/login');
    await page.getByTestId('email-input').fill('admin@vownow.com');
    await page.getByTestId('password-input').fill('admin123');
    await page.getByTestId('login-submit-button').click();
    await page.getByTestId('2fa-code-input').fill('123456');
    await page.getByTestId('verify-2fa-button').click();
    await expect(page).toHaveURL('/admin/dashboard');

    // ACT: Open new tab and navigate to admin area
    const newTab = await page.context().newPage();
    await newTab.goto('/admin/dashboard');

    // ASSERT: Should be authenticated in new tab
    await expect(newTab.getByTestId('admin-dashboard')).toBeVisible();
    await expect(newTab.getByTestId('admin-user-menu')).toBeVisible();

    await newTab.close();
  });

  test('should handle logout functionality', async () => {
    // ARRANGE: Complete login flow
    await page.goto('/admin/login');
    await page.getByTestId('email-input').fill('admin@vownow.com');
    await page.getByTestId('password-input').fill('admin123');
    await page.getByTestId('login-submit-button').click();
    await page.getByTestId('2fa-code-input').fill('123456');
    await page.getByTestId('verify-2fa-button').click();
    await expect(page).toHaveURL('/admin/dashboard');

    // ACT: Logout
    await page.getByTestId('admin-user-menu').click();
    await page.getByTestId('logout-button').click();

    // ASSERT: Should redirect to login page and clear session
    await expect(page).toHaveURL(/.*\/admin\/login/);
    await expect(page.getByTestId('admin-login-form')).toBeVisible();

    // Verify session is cleared by trying to access dashboard
    await page.goto('/admin/dashboard');
    await expect(page).toHaveURL(/.*\/admin\/login/);
  });

  test('should handle rate limiting for failed login attempts', async () => {
    await page.goto('/admin/login');

    // ACT: Make multiple failed login attempts
    for (let i = 0; i < 5; i++) {
      await page.getByTestId('email-input').fill('admin@vownow.com');
      await page.getByTestId('password-input').fill('wrongpassword');
      await page.getByTestId('login-submit-button').click();
      await expect(page.getByTestId('login-error-message')).toBeVisible();
      await page.waitForTimeout(500); // Brief pause between attempts
    }

    // ASSERT: Should show rate limiting message
    await page.getByTestId('email-input').fill('admin@vownow.com');
    await page.getByTestId('password-input').fill('wrongpassword');
    await page.getByTestId('login-submit-button').click();

    await expect(page.getByTestId('rate-limit-error')).toBeVisible();
    await expect(page.getByTestId('rate-limit-error')).toContainText('Too many failed attempts');
  });

  test('should be accessible via keyboard navigation', async () => {
    await page.goto('/admin/login');

    // ACT: Navigate form using keyboard
    await page.keyboard.press('Tab'); // Focus email input
    await page.keyboard.type('admin@vownow.com');
    await page.keyboard.press('Tab'); // Focus password input
    await page.keyboard.type('admin123');
    await page.keyboard.press('Tab'); // Focus submit button
    await page.keyboard.press('Enter'); // Submit form

    // ASSERT: Should proceed to 2FA
    await expect(page).toHaveURL(/.*\/admin\/verify-2fa/);
  });
});

test.describe('Cross-browser Login Compatibility', () => {
  ['chromium', 'firefox', 'webkit'].forEach(browserName => {
    test(`should work correctly in ${browserName}`, async ({ browser }) => {
      const page = await browser.newPage();

      // Complete login flow
      await page.goto('/admin/login');
      await page.getByTestId('email-input').fill('admin@vownow.com');
      await page.getByTestId('password-input').fill('admin123');
      await page.getByTestId('login-submit-button').click();
      await page.getByTestId('2fa-code-input').fill('123456');
      await page.getByTestId('verify-2fa-button').click();

      // Verify successful login
      await expect(page).toHaveURL('/admin/dashboard');
      await expect(page.getByTestId('admin-dashboard')).toBeVisible();

      await page.close();
    });
  });
});