import { test, expect, Page } from '@playwright/test';

test.describe('T034: Report Generation Workflow', () => {
  let page: Page;

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();

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
    await page.close();
  });

  test('should generate comprehensive user analytics report', async () => {
    // ARRANGE: Navigate to reports section
    await page.getByTestId('nav-reports').click();
    await expect(page.getByTestId('reports-dashboard')).toBeVisible();

    // ACT: Create new user analytics report
    await page.getByTestId('create-report-button').click();
    await expect(page.getByTestId('report-creation-dialog')).toBeVisible();

    await page.getByTestId('report-type-dropdown').selectOption('user-analytics');
    await page.getByTestId('report-name-input').fill('Monthly User Analytics Report');

    // Configure report parameters
    await page.getByTestId('report-date-range-preset').selectOption('last-30-days');
    await page.getByTestId('report-include-demographics').check();
    await page.getByTestId('report-include-activity-metrics').check();
    await page.getByTestId('report-include-growth-trends').check();

    // Set report format and delivery
    await page.getByTestId('report-format-pdf').check();
    await page.getByTestId('report-email-delivery').check();
    await page.getByTestId('report-email-recipients').fill('admin@vownow.com, analytics@vownow.com');

    await page.getByTestId('generate-report-button').click();

    // ASSERT: Should initiate report generation
    await expect(page.getByTestId('report-generation-started')).toBeVisible();
    await expect(page.getByTestId('report-queue-notification')).toContainText('Report queued for generation');

    // Verify report appears in reports list
    await expect(page.getByTestId('reports-list')).toContainText('Monthly User Analytics Report');
    await expect(page.getByTestId('report-status-processing')).toBeVisible();
  });

  test('should create custom financial report with filtering', async () => {
    // ARRANGE: Navigate to reports
    await page.getByTestId('nav-reports').click();
    await expect(page.getByTestId('reports-dashboard')).toBeVisible();

    // ACT: Create financial report
    await page.getByTestId('create-report-button').click();
    await page.getByTestId('report-type-dropdown').selectOption('financial');
    await page.getByTestId('report-name-input').fill('Q4 2024 Financial Summary');

    // Configure financial report specifics
    await page.getByTestId('financial-report-type').selectOption('revenue-analysis');
    await page.getByTestId('report-date-from').fill('2024-10-01');
    await page.getByTestId('report-date-to').fill('2024-12-31');

    // Add filters
    await page.getByTestId('add-filter-button').click();
    await page.getByTestId('filter-type-dropdown').selectOption('payment-method');
    await page.getByTestId('filter-value-dropdown').selectOption('credit-card');

    await page.getByTestId('add-filter-button').click();
    await page.getByTestId('filter-type-dropdown').nth(1).selectOption('region');
    await page.getByTestId('filter-value-dropdown').nth(1).selectOption('north-america');

    // Configure visualizations
    await page.getByTestId('include-revenue-chart').check();
    await page.getByTestId('include-payment-breakdown').check();
    await page.getByTestId('include-regional-analysis').check();

    await page.getByTestId('generate-report-button').click();

    // ASSERT: Should generate filtered financial report
    await expect(page.getByTestId('report-generation-started')).toBeVisible();
    await expect(page.getByTestId('reports-list')).toContainText('Q4 2024 Financial Summary');
  });

  test('should generate automated compliance report', async () => {
    // ARRANGE: Navigate to compliance reports
    await page.getByTestId('nav-reports').click();
    await page.getByTestId('reports-compliance-tab').click();
    await expect(page.getByTestId('compliance-reports-section')).toBeVisible();

    // ACT: Generate GDPR compliance report
    await page.getByTestId('generate-gdpr-report').click();
    await expect(page.getByTestId('compliance-report-dialog')).toBeVisible();

    await page.getByTestId('compliance-report-period').selectOption('quarterly');
    await page.getByTestId('compliance-report-quarter').selectOption('q4-2024');

    // Select compliance areas
    await page.getByTestId('compliance-data-processing').check();
    await page.getByTestId('compliance-user-rights').check();
    await page.getByTestId('compliance-data-breaches').check();
    await page.getByTestId('compliance-consent-tracking').check();

    await page.getByTestId('generate-compliance-report').click();

    // ASSERT: Should generate compliance report
    await expect(page.getByTestId('compliance-report-generated')).toBeVisible();
    await expect(page.getByTestId('compliance-reports-list')).toContainText('GDPR Compliance Report - Q4 2024');
    await expect(page.getByTestId('compliance-report-status')).toContainText('Generated');
  });

  test('should handle report templates and customization', async () => {
    // ARRANGE: Navigate to report templates
    await page.getByTestId('nav-reports').click();
    await page.getByTestId('reports-templates-tab').click();
    await expect(page.getByTestId('report-templates-section')).toBeVisible();

    // ACT: Create custom report template
    await page.getByTestId('create-template-button').click();
    await expect(page.getByTestId('template-creation-dialog')).toBeVisible();

    await page.getByTestId('template-name').fill('Custom User Engagement Template');
    await page.getByTestId('template-description').fill('Monthly user engagement and activity metrics');

    // Configure template sections
    await page.getByTestId('template-section-add').click();
    await page.getByTestId('section-type').selectOption('metrics-overview');
    await page.getByTestId('section-title').fill('User Engagement Metrics');

    await page.getByTestId('template-section-add').click();
    await page.getByTestId('section-type').nth(1).selectOption('data-visualization');
    await page.getByTestId('section-title').nth(1).fill('Activity Trends Chart');
    await page.getByTestId('chart-type').selectOption('line-chart');

    await page.getByTestId('template-section-add').click();
    await page.getByTestId('section-type').nth(2).selectOption('data-table');
    await page.getByTestId('section-title').nth(2).fill('Top Performing Content');

    await page.getByTestId('save-template-button').click();

    // ASSERT: Should save custom template
    await expect(page.getByTestId('template-saved-notification')).toBeVisible();
    await expect(page.getByTestId('template-list')).toContainText('Custom User Engagement Template');

    // Use template to generate report
    await page.getByTestId('use-template-button').click();
    await expect(page.getByTestId('report-creation-dialog')).toBeVisible();
    await expect(page.getByTestId('report-name-input')).toHaveValue('Custom User Engagement Template Report');

    await page.getByTestId('generate-report-button').click();
    await expect(page.getByTestId('report-generation-started')).toBeVisible();
  });

  test('should support report scheduling and automation', async () => {
    // ARRANGE: Navigate to scheduled reports
    await page.getByTestId('nav-reports').click();
    await page.getByTestId('scheduled-reports-tab').click();
    await expect(page.getByTestId('scheduled-reports-section')).toBeVisible();

    // ACT: Create scheduled report
    await page.getByTestId('create-scheduled-report').click();
    await expect(page.getByTestId('schedule-report-dialog')).toBeVisible();

    await page.getByTestId('schedule-report-name').fill('Weekly Dashboard Summary');
    await page.getByTestId('schedule-report-type').selectOption('dashboard-summary');

    // Configure schedule
    await page.getByTestId('schedule-frequency').selectOption('weekly');
    await page.getByTestId('schedule-day-of-week').selectOption('monday');
    await page.getByTestId('schedule-time').fill('08:00');
    await page.getByTestId('schedule-timezone').selectOption('america/new_york');

    // Configure delivery
    await page.getByTestId('schedule-email-enabled').check();
    await page.getByTestId('schedule-email-recipients').fill('team@vownow.com, admin@vownow.com');
    await page.getByTestId('schedule-email-format').selectOption('pdf');

    await page.getByTestId('save-scheduled-report').click();

    // ASSERT: Should create scheduled report
    await expect(page.getByTestId('schedule-created-notification')).toBeVisible();
    await expect(page.getByTestId('scheduled-reports-list')).toContainText('Weekly Dashboard Summary');
    await expect(page.getByTestId('schedule-status-active')).toBeVisible();
    await expect(page.getByTestId('next-run-time')).toContainText('Monday at 08:00');
  });

  test('should provide interactive report preview and editing', async () => {
    // ARRANGE: Generate a report first
    await page.getByTestId('nav-reports').click();
    await page.getByTestId('create-report-button').click();
    await page.getByTestId('report-type-dropdown').selectOption('user-analytics');
    await page.getByTestId('report-name-input').fill('Test Preview Report');
    await page.getByTestId('generate-report-button').click();

    // Wait for report to be generated (mock fast generation)
    await page.getByTestId('reports-list').click();
    await page.getByText('Test Preview Report').click();

    // ACT: Preview and edit report
    await expect(page.getByTestId('report-preview')).toBeVisible();
    await expect(page.getByTestId('report-edit-mode-toggle')).toBeVisible();

    await page.getByTestId('report-edit-mode-toggle').click();
    await expect(page.getByTestId('report-editor')).toBeVisible();

    // Edit report sections
    await page.getByTestId('section-edit-button').first().click();
    await page.getByTestId('section-title-edit').fill('Updated Metrics Overview');
    await page.getByTestId('save-section-button').click();

    // Add new section
    await page.getByTestId('add-section-button').click();
    await page.getByTestId('new-section-type').selectOption('text-block');
    await page.getByTestId('new-section-content').fill('Additional insights and recommendations');
    await page.getByTestId('insert-section-button').click();

    // Save report changes
    await page.getByTestId('save-report-changes').click();

    // ASSERT: Should save report modifications
    await expect(page.getByTestId('report-saved-notification')).toBeVisible();
    await expect(page.getByTestId('report-preview')).toContainText('Updated Metrics Overview');
    await expect(page.getByTestId('report-preview')).toContainText('Additional insights and recommendations');
  });

  test('should handle report sharing and permissions', async () => {
    // ARRANGE: Create a report
    await page.getByTestId('nav-reports').click();
    await page.getByTestId('create-report-button').click();
    await page.getByTestId('report-type-dropdown').selectOption('user-analytics');
    await page.getByTestId('report-name-input').fill('Shareable Test Report');
    await page.getByTestId('generate-report-button').click();

    // Navigate to report
    await page.getByText('Shareable Test Report').click();
    await expect(page.getByTestId('report-preview')).toBeVisible();

    // ACT: Configure sharing settings
    await page.getByTestId('report-share-button').click();
    await expect(page.getByTestId('share-report-dialog')).toBeVisible();

    // Share with specific users
    await page.getByTestId('share-with-users-tab').click();
    await page.getByTestId('add-user-permission').click();
    await page.getByTestId('user-email-input').fill('analyst@vownow.com');
    await page.getByTestId('permission-level').selectOption('view-only');
    await page.getByTestId('add-user-button').click();

    // Generate shareable link
    await page.getByTestId('shareable-link-tab').click();
    await page.getByTestId('generate-link-button').click();
    await expect(page.getByTestId('shareable-link-input')).toBeVisible();

    // Configure link settings
    await page.getByTestId('link-expires-enabled').check();
    await page.getByTestId('link-expiry-date').fill('2025-01-31');
    await page.getByTestId('link-password-protected').check();
    await page.getByTestId('link-password').fill('report2024');

    await page.getByTestId('save-sharing-settings').click();

    // ASSERT: Should configure sharing properly
    await expect(page.getByTestId('sharing-configured-notification')).toBeVisible();
    await expect(page.getByTestId('report-shared-status')).toContainText('Shared with 1 user');
  });

  test('should support report version control and history', async () => {
    // ARRANGE: Create and modify a report
    await page.getByTestId('nav-reports').click();
    await page.getByTestId('create-report-button').click();
    await page.getByTestId('report-type-dropdown').selectOption('user-analytics');
    await page.getByTestId('report-name-input').fill('Versioned Report');
    await page.getByTestId('generate-report-button').click();

    await page.getByText('Versioned Report').click();
    await expect(page.getByTestId('report-preview')).toBeVisible();

    // Make first modification
    await page.getByTestId('report-edit-mode-toggle').click();
    await page.getByTestId('section-edit-button').first().click();
    await page.getByTestId('section-title-edit').fill('Version 1.1 - Updated Title');
    await page.getByTestId('save-section-button').click();
    await page.getByTestId('save-report-changes').click();

    // Make second modification
    await page.getByTestId('add-section-button').click();
    await page.getByTestId('new-section-type').selectOption('text-block');
    await page.getByTestId('new-section-content').fill('Version 1.2 - Added content');
    await page.getByTestId('insert-section-button').click();
    await page.getByTestId('save-report-changes').click();

    // ACT: Access version history
    await page.getByTestId('report-versions-button').click();
    await expect(page.getByTestId('version-history-dialog')).toBeVisible();

    // ASSERT: Should show version history
    await expect(page.getByTestId('version-list')).toContainText('Version 1.0');
    await expect(page.getByTestId('version-list')).toContainText('Version 1.1');
    await expect(page.getByTestId('version-list')).toContainText('Version 1.2');

    // Test version comparison
    await page.getByTestId('compare-versions-button').click();
    await page.getByTestId('version-from').selectOption('1.0');
    await page.getByTestId('version-to').selectOption('1.2');
    await page.getByTestId('show-comparison-button').click();

    await expect(page.getByTestId('version-comparison-view')).toBeVisible();
    await expect(page.getByTestId('changes-summary')).toContainText('2 sections modified, 1 section added');

    // Test version restoration
    await page.getByTestId('restore-version-button').click();
    await page.getByTestId('confirm-restore-button').click();

    await expect(page.getByTestId('version-restored-notification')).toBeVisible();
  });

  test('should handle large reports with pagination and performance', async () => {
    // ARRANGE: Create large dataset report
    await page.getByTestId('nav-reports').click();
    await page.getByTestId('create-report-button').click();
    await page.getByTestId('report-type-dropdown').selectOption('comprehensive-analytics');
    await page.getByTestId('report-name-input').fill('Large Dataset Report');

    // Configure for large dataset
    await page.getByTestId('report-date-range-preset').selectOption('last-12-months');
    await page.getByTestId('include-all-metrics').check();
    await page.getByTestId('detailed-breakdown-enabled').check();

    await page.getByTestId('generate-report-button').click();

    // Wait for generation (this will show progress)
    await expect(page.getByTestId('report-generation-progress')).toBeVisible();
    await expect(page.getByTestId('generation-progress-bar')).toBeVisible();

    // Navigate to generated report
    await page.getByText('Large Dataset Report').click();

    // ACT: Test report pagination and performance
    await expect(page.getByTestId('report-preview')).toBeVisible({ timeout: 30000 });

    // ASSERT: Should handle large report efficiently
    await expect(page.getByTestId('report-pagination')).toBeVisible();
    await expect(page.getByTestId('page-info')).toContainText('Page 1 of');

    // Test pagination performance
    const startTime = Date.now();
    await page.getByTestId('next-page-button').click();
    await expect(page.getByTestId('page-info')).toContainText('Page 2 of');
    const paginationTime = Date.now() - startTime;

    expect(paginationTime).toBeLessThan(2000); // Should paginate quickly

    // Test report search/filtering
    await page.getByTestId('report-search-input').fill('revenue');
    await page.getByTestId('report-search-button').click();
    await expect(page.getByTestId('search-results-summary')).toBeVisible();
  });
});

test.describe('Report Generation Cross-Browser Testing', () => {
  ['chromium', 'firefox', 'webkit'].forEach(browserName => {
    test(`should generate reports correctly in ${browserName}`, async ({ browser }) => {
      const page = await browser.newPage();

      // Login
      await page.goto('/admin/login');
      await page.getByTestId('email-input').fill('admin@vownow.com');
      await page.getByTestId('password-input').fill('admin123');
      await page.getByTestId('login-submit-button').click();
      await page.getByTestId('2fa-code-input').fill('123456');
      await page.getByTestId('verify-2fa-button').click();

      // Generate report
      await page.getByTestId('nav-reports').click();
      await page.getByTestId('create-report-button').click();
      await page.getByTestId('report-type-dropdown').selectOption('user-analytics');
      await page.getByTestId('report-name-input').fill(`${browserName} Test Report`);
      await page.getByTestId('generate-report-button').click();

      // Verify report generation works across browsers
      await expect(page.getByTestId('report-generation-started')).toBeVisible();
      await expect(page.getByTestId('reports-list')).toContainText(`${browserName} Test Report`);

      await page.close();
    });
  });
});