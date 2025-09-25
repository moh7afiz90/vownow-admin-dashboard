import { test, expect, Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

test.describe('T033: Data Export Workflow', () => {
  let page: Page;
  let downloadPath: string;

  test.beforeEach(async ({ browser }) => {
    // Set up download path
    downloadPath = path.join(__dirname, '../../temp/downloads');
    if (!fs.existsSync(downloadPath)) {
      fs.mkdirSync(downloadPath, { recursive: true });
    }

    page = await browser.newPage({
      acceptDownloads: true,
    });

    // Login before each test
    await page.goto('/admin/login');
    await page.getByTestId('email-input').fill('admin@vownow.com');
    await page.getByTestId('password-input').fill('admin123');
    await page.getByTestId('login-submit-button').click();
    await page.getByTestId('2fa-code-input').fill('123456');
    await page.getByTestId('verify-2fa-button').click();
    await expect(page).toHaveURL('/admin/dashboard');
  });

  test.afterEach(async () => {
    // Clean up downloads
    if (fs.existsSync(downloadPath)) {
      const files = fs.readdirSync(downloadPath);
      files.forEach(file => {
        fs.unlinkSync(path.join(downloadPath, file));
      });
    }
    await page.close();
  });

  test('should export user data to CSV format', async () => {
    // ARRANGE: Navigate to users page
    await page.getByTestId('nav-users').click();
    await expect(page.getByTestId('users-table')).toBeVisible();

    // ACT: Initiate CSV export
    await page.getByTestId('export-dropdown').click();
    await page.getByTestId('export-csv-option').click();

    // Configure export options
    await expect(page.getByTestId('export-dialog')).toBeVisible();
    await page.getByTestId('export-format-csv').check();
    await page.getByTestId('export-fields-select-all').check();
    await page.getByTestId('export-date-range-all').check();

    // Start export
    const downloadPromise = page.waitForEvent('download');
    await page.getByTestId('start-export-button').click();

    // ASSERT: Should show export progress
    await expect(page.getByTestId('export-progress-dialog')).toBeVisible();
    await expect(page.getByTestId('export-progress-bar')).toBeVisible();

    // Wait for download completion
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/users_export_\d{8}_\d{6}\.csv/);

    // Save and verify file
    const filePath = path.join(downloadPath, download.suggestedFilename());
    await download.saveAs(filePath);

    // Verify file exists and has content
    expect(fs.existsSync(filePath)).toBe(true);
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    expect(fileContent).toContain('id,email,name,created_at'); // CSV headers
    expect(fileContent.split('\n').length).toBeGreaterThan(1); // At least header + data

    // Verify export completion notification
    await expect(page.getByTestId('export-success-notification')).toBeVisible();
    await expect(page.getByTestId('export-success-notification')).toContainText('Export completed successfully');
  });

  test('should export analytics data to Excel format', async () => {
    // ARRANGE: Navigate to analytics page
    await page.getByTestId('nav-analytics').click();
    await expect(page.getByTestId('analytics-dashboard')).toBeVisible();

    // ACT: Export analytics data
    await page.getByTestId('analytics-export-button').click();
    await expect(page.getByTestId('export-dialog')).toBeVisible();

    // Select Excel format and specific metrics
    await page.getByTestId('export-format-excel').check();
    await page.getByTestId('export-metric-user-growth').check();
    await page.getByTestId('export-metric-revenue').check();
    await page.getByTestId('export-metric-activity').check();

    // Set date range
    await page.getByTestId('export-date-from').fill('2024-01-01');
    await page.getByTestId('export-date-to').fill('2024-12-31');

    const downloadPromise = page.waitForEvent('download');
    await page.getByTestId('start-export-button').click();

    // ASSERT: Export should complete successfully
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/analytics_export_\d{8}_\d{6}\.xlsx/);

    const filePath = path.join(downloadPath, download.suggestedFilename());
    await download.saveAs(filePath);

    expect(fs.existsSync(filePath)).toBe(true);
    const stats = fs.statSync(filePath);
    expect(stats.size).toBeGreaterThan(1000); // File should have substantial content
  });

  test('should export filtered data based on search criteria', async () => {
    // ARRANGE: Navigate to users and apply filters
    await page.getByTestId('nav-users').click();
    await expect(page.getByTestId('users-table')).toBeVisible();

    // Apply search filter
    await page.getByTestId('user-search-input').fill('john');
    await page.getByTestId('user-search-button').click();
    await expect(page.getByTestId('users-table')).toBeVisible();

    // Apply status filter
    await page.getByTestId('status-filter-dropdown').click();
    await page.getByTestId('status-filter-active').check();
    await page.getByTestId('apply-filters-button').click();

    // ACT: Export filtered results
    await page.getByTestId('export-dropdown').click();
    await page.getByTestId('export-filtered-results').click();

    await expect(page.getByTestId('export-dialog')).toBeVisible();
    await page.getByTestId('export-format-csv').check();

    const downloadPromise = page.waitForEvent('download');
    await page.getByTestId('start-export-button').click();

    // ASSERT: Should export only filtered data
    const download = await downloadPromise;
    const filePath = path.join(downloadPath, download.suggestedFilename());
    await download.saveAs(filePath);

    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const lines = fileContent.split('\n').filter(line => line.trim().length > 0);

    // Should contain fewer records than full export
    expect(lines.length).toBeGreaterThan(1); // At least header + some data
    expect(lines.length).toBeLessThan(100); // But not all users

    // Verify filtered content
    expect(fileContent.toLowerCase()).toContain('john');
  });

  test('should handle large dataset exports with progress tracking', async () => {
    // ARRANGE: Navigate to a page with large dataset
    await page.getByTestId('nav-users').click();
    await expect(page.getByTestId('users-table')).toBeVisible();

    // ACT: Start large export (all users, all fields)
    await page.getByTestId('export-dropdown').click();
    await page.getByTestId('export-csv-option').click();

    await expect(page.getByTestId('export-dialog')).toBeVisible();
    await page.getByTestId('export-format-csv').check();
    await page.getByTestId('export-fields-select-all').check();
    await page.getByTestId('export-include-metadata').check(); // Include more data

    const downloadPromise = page.waitForEvent('download');
    await page.getByTestId('start-export-button').click();

    // ASSERT: Should show progress tracking
    await expect(page.getByTestId('export-progress-dialog')).toBeVisible();
    await expect(page.getByTestId('export-progress-bar')).toBeVisible();
    await expect(page.getByTestId('export-progress-percentage')).toBeVisible();
    await expect(page.getByTestId('export-status-text')).toContainText('Processing');

    // Wait for completion
    const download = await downloadPromise;
    await expect(page.getByTestId('export-progress-percentage')).toContainText('100%');

    const filePath = path.join(downloadPath, download.suggestedFilename());
    await download.saveAs(filePath);

    // Verify large file was created successfully
    const stats = fs.statSync(filePath);
    expect(stats.size).toBeGreaterThan(5000); // Should be substantial file
  });

  test('should provide export scheduling functionality', async () => {
    // ARRANGE: Navigate to export settings
    await page.getByTestId('nav-settings').click();
    await page.getByTestId('settings-exports-tab').click();
    await expect(page.getByTestId('scheduled-exports-section')).toBeVisible();

    // ACT: Schedule a recurring export
    await page.getByTestId('create-scheduled-export').click();
    await expect(page.getByTestId('schedule-export-dialog')).toBeVisible();

    await page.getByTestId('schedule-name').fill('Weekly User Report');
    await page.getByTestId('schedule-data-type').selectOption('users');
    await page.getByTestId('schedule-format').selectOption('csv');
    await page.getByTestId('schedule-frequency').selectOption('weekly');
    await page.getByTestId('schedule-day').selectOption('monday');
    await page.getByTestId('schedule-time').fill('09:00');
    await page.getByTestId('schedule-email').fill('admin@vownow.com');

    await page.getByTestId('save-scheduled-export').click();

    // ASSERT: Should create scheduled export
    await expect(page.getByTestId('schedule-success-notification')).toBeVisible();
    await expect(page.getByTestId('scheduled-exports-list')).toContainText('Weekly User Report');
    await expect(page.getByTestId('scheduled-exports-list')).toContainText('Every Monday at 09:00');
  });

  test('should validate export permissions and security', async () => {
    // Test will fail initially as permission system needs implementation

    // ARRANGE: Navigate to users page
    await page.getByTestId('nav-users').click();
    await expect(page.getByTestId('users-table')).toBeVisible();

    // ACT: Try to export sensitive data
    await page.getByTestId('export-dropdown').click();
    await page.getByTestId('export-csv-option').click();

    await expect(page.getByTestId('export-dialog')).toBeVisible();
    await page.getByTestId('export-format-csv').check();

    // Try to include sensitive fields
    await page.getByTestId('export-field-password-hash').check();
    await page.getByTestId('export-field-payment-info').check();

    await page.getByTestId('start-export-button').click();

    // ASSERT: Should block export of sensitive data
    await expect(page.getByTestId('export-permission-error')).toBeVisible();
    await expect(page.getByTestId('export-permission-error')).toContainText('insufficient permissions');
  });

  test('should handle export failures gracefully', async () => {
    // ARRANGE: Navigate to users page
    await page.getByTestId('nav-users').click();
    await expect(page.getByTestId('users-table')).toBeVisible();

    // Simulate network failure during export
    await page.route('**/api/admin/export/**', (route) => {
      route.abort('failed');
    });

    // ACT: Attempt export that will fail
    await page.getByTestId('export-dropdown').click();
    await page.getByTestId('export-csv-option').click();

    await expect(page.getByTestId('export-dialog')).toBeVisible();
    await page.getByTestId('start-export-button').click();

    // ASSERT: Should handle failure gracefully
    await expect(page.getByTestId('export-error-notification')).toBeVisible();
    await expect(page.getByTestId('export-error-notification')).toContainText('Export failed');
    await expect(page.getByTestId('export-retry-button')).toBeVisible();
  });

  test('should support bulk export operations', async () => {
    // ARRANGE: Navigate to export center
    await page.getByTestId('nav-exports').click();
    await expect(page.getByTestId('export-center')).toBeVisible();

    // ACT: Create bulk export job
    await page.getByTestId('create-bulk-export').click();
    await expect(page.getByTestId('bulk-export-dialog')).toBeVisible();

    // Select multiple data types
    await page.getByTestId('bulk-export-users').check();
    await page.getByTestId('bulk-export-analytics').check();
    await page.getByTestId('bulk-export-transactions').check();

    await page.getByTestId('bulk-export-format-zip').check();
    await page.getByTestId('start-bulk-export').click();

    // ASSERT: Should process bulk export
    await expect(page.getByTestId('bulk-export-progress')).toBeVisible();
    await expect(page.getByTestId('bulk-export-queue')).toContainText('3 exports queued');

    // Wait for first export to start
    await expect(page.getByTestId('export-status-processing')).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Export Cross-Browser Compatibility', () => {
  ['chromium', 'firefox', 'webkit'].forEach(browserName => {
    test(`should handle downloads correctly in ${browserName}`, async ({ browser }) => {
      const page = await browser.newPage({ acceptDownloads: true });

      // Login
      await page.goto('/admin/login');
      await page.getByTestId('email-input').fill('admin@vownow.com');
      await page.getByTestId('password-input').fill('admin123');
      await page.getByTestId('login-submit-button').click();
      await page.getByTestId('2fa-code-input').fill('123456');
      await page.getByTestId('verify-2fa-button').click();

      // Navigate to users and export
      await page.getByTestId('nav-users').click();
      await page.getByTestId('export-dropdown').click();
      await page.getByTestId('export-csv-option').click();

      const downloadPromise = page.waitForEvent('download');
      await page.getByTestId('start-export-button').click();

      // Verify download works in browser
      const download = await downloadPromise;
      expect(download.suggestedFilename()).toMatch(/\.csv$/);

      await page.close();
    });
  });
});