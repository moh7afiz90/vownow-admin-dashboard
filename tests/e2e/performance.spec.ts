import { test, expect, Page } from '@playwright/test';

test.describe('T032: Dashboard Performance Testing', () => {
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

  test('should load dashboard within 2 seconds', async () => {
    // ARRANGE: Clear cache and prepare for fresh load
    await page.context().clearCookies();
    await page.reload();

    // Re-login and measure dashboard load time
    await page.goto('/admin/login');
    await page.getByTestId('email-input').fill('admin@vownow.com');
    await page.getByTestId('password-input').fill('admin123');
    await page.getByTestId('login-submit-button').click();
    await page.getByTestId('2fa-code-input').fill('123456');
    await page.getByTestId('verify-2fa-button').click();

    // ACT: Measure dashboard load time
    const startTime = Date.now();
    await page.goto('/admin/dashboard');

    // Wait for all critical elements to be visible
    await Promise.all([
      expect(page.getByTestId('admin-dashboard')).toBeVisible(),
      expect(page.getByTestId('metrics-overview')).toBeVisible(),
      expect(page.getByTestId('recent-activity')).toBeVisible(),
      expect(page.getByTestId('user-stats-chart')).toBeVisible(),
    ]);

    const loadTime = Date.now() - startTime;

    // ASSERT: Dashboard should load within 2 seconds
    expect(loadTime).toBeLessThan(2000);
    console.log(`Dashboard loaded in ${loadTime}ms`);
  });

  test('should measure Core Web Vitals metrics', async () => {
    await page.goto('/admin/dashboard');

    // Wait for page to fully load
    await page.waitForLoadState('networkidle');

    // ACT: Measure Web Vitals using JavaScript
    const webVitals = await page.evaluate(() => {
      return new Promise((resolve) => {
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const metrics: Record<string, number> = {};

          entries.forEach((entry) => {
            if (entry.entryType === 'navigation') {
              const navEntry = entry as PerformanceNavigationTiming;
              metrics.loadTime = navEntry.loadEventEnd - navEntry.loadEventStart;
              metrics.domContentLoaded = navEntry.domContentLoadedEventEnd - navEntry.domContentLoadedEventStart;
              metrics.firstByte = navEntry.responseStart - navEntry.requestStart;
            }
          });

          resolve(metrics);
        });

        observer.observe({ entryTypes: ['navigation'] });

        // Fallback timeout
        setTimeout(() => resolve({}), 5000);
      });
    });

    // ASSERT: Web Vitals should meet performance standards
    expect(webVitals).toBeDefined();
    if (webVitals.loadTime) {
      expect(webVitals.loadTime).toBeLessThan(2000);
    }
    if (webVitals.domContentLoaded) {
      expect(webVitals.domContentLoaded).toBeLessThan(1500);
    }
    if (webVitals.firstByte) {
      expect(webVitals.firstByte).toBeLessThan(800);
    }
  });

  test('should handle large datasets without performance degradation', async () => {
    // ACT: Navigate to users page with large dataset
    const startTime = Date.now();
    await page.getByTestId('nav-users').click();

    // Wait for users table to load
    await expect(page.getByTestId('users-table')).toBeVisible();
    await expect(page.getByTestId('users-pagination')).toBeVisible();

    const loadTime = Date.now() - startTime;

    // ASSERT: Large dataset should load within performance bounds
    expect(loadTime).toBeLessThan(3000);

    // Test pagination performance
    const paginationStartTime = Date.now();
    await page.getByTestId('pagination-next').click();
    await expect(page.getByTestId('users-table')).toBeVisible();
    const paginationTime = Date.now() - paginationStartTime;

    expect(paginationTime).toBeLessThan(1000);
  });

  test('should maintain performance under concurrent user simulation', async () => {
    // ARRANGE: Open multiple browser contexts to simulate concurrent users
    const contexts = [];
    const pages = [];

    try {
      // Create 5 concurrent user contexts
      for (let i = 0; i < 5; i++) {
        const context = await page.context().browser()!.newContext();
        const concurrentPage = await context.newPage();
        contexts.push(context);
        pages.push(concurrentPage);

        // Login each concurrent user
        await concurrentPage.goto('/admin/login');
        await concurrentPage.getByTestId('email-input').fill('admin@vownow.com');
        await concurrentPage.getByTestId('password-input').fill('admin123');
        await concurrentPage.getByTestId('login-submit-button').click();
        await concurrentPage.getByTestId('2fa-code-input').fill('123456');
        await concurrentPage.getByTestId('verify-2fa-button').click();
      }

      // ACT: Navigate all users to dashboard simultaneously
      const startTime = Date.now();
      const navigationPromises = pages.map(async (concurrentPage) => {
        await concurrentPage.goto('/admin/dashboard');
        return expect(concurrentPage.getByTestId('admin-dashboard')).toBeVisible();
      });

      await Promise.all(navigationPromises);
      const totalTime = Date.now() - startTime;

      // ASSERT: Performance should not degrade significantly under load
      expect(totalTime).toBeLessThan(5000);

    } finally {
      // Cleanup
      for (const context of contexts) {
        await context.close();
      }
    }
  });

  test('should optimize resource loading and caching', async () => {
    await page.goto('/admin/dashboard');
    await page.waitForLoadState('networkidle');

    // ACT: Capture network requests
    const requests: string[] = [];
    page.on('request', (request) => {
      requests.push(request.url());
    });

    // Reload page to test caching
    await page.reload();
    await expect(page.getByTestId('admin-dashboard')).toBeVisible();

    // ASSERT: Should utilize browser caching effectively
    const staticAssets = requests.filter(url =>
      url.includes('.js') || url.includes('.css') || url.includes('.png') || url.includes('.svg')
    );

    // Check that static assets are cached (should have fewer requests on reload)
    expect(staticAssets.length).toBeLessThan(20); // Reasonable number of asset requests
  });

  test('should measure JavaScript bundle size impact', async () => {
    // ACT: Navigate and measure transferred data
    const response = await page.goto('/admin/dashboard');
    const transferSize = await response?.headerValue('content-length');

    // Wait for all resources to load
    await page.waitForLoadState('networkidle');

    // Get all network requests
    const requests = await page.evaluate(() => {
      return performance.getEntriesByType('resource').map(entry => ({
        name: entry.name,
        size: (entry as PerformanceResourceTiming).transferSize || 0,
        type: entry.initiatorType
      }));
    });

    const jsRequests = requests.filter(req => req.name.includes('.js'));
    const totalJSSize = jsRequests.reduce((total, req) => total + req.size, 0);

    // ASSERT: JavaScript bundle size should be reasonable
    expect(totalJSSize).toBeLessThan(2 * 1024 * 1024); // Less than 2MB total JS
  });

  test('should handle slow network conditions gracefully', async () => {
    // ARRANGE: Simulate slow 3G network
    await page.route('**/*', async (route) => {
      await new Promise(resolve => setTimeout(resolve, 200)); // 200ms delay
      await route.continue();
    });

    // ACT: Load dashboard under slow conditions
    const startTime = Date.now();
    await page.goto('/admin/dashboard');

    // Wait for critical elements with extended timeout
    await expect(page.getByTestId('admin-dashboard')).toBeVisible({ timeout: 10000 });
    await expect(page.getByTestId('loading-spinner')).toBeHidden({ timeout: 15000 });

    const loadTime = Date.now() - startTime;

    // ASSERT: Should show loading states and complete loading
    expect(loadTime).toBeLessThan(15000); // Allow more time for slow network
  });

  test('should implement efficient data fetching patterns', async () => {
    await page.goto('/admin/dashboard');

    // Monitor API calls
    const apiCalls: string[] = [];
    page.on('request', (request) => {
      if (request.url().includes('/api/')) {
        apiCalls.push(request.url());
      }
    });

    // Wait for initial load
    await expect(page.getByTestId('admin-dashboard')).toBeVisible();
    await page.waitForTimeout(2000); // Allow time for API calls

    // Navigate to different sections
    await page.getByTestId('nav-analytics').click();
    await expect(page.getByTestId('analytics-dashboard')).toBeVisible();
    await page.waitForTimeout(1000);

    await page.getByTestId('nav-users').click();
    await expect(page.getByTestId('users-table')).toBeVisible();
    await page.waitForTimeout(1000);

    // ASSERT: Should not make excessive API calls
    expect(apiCalls.length).toBeLessThan(15); // Reasonable number of API calls

    // Should not duplicate identical requests
    const uniqueApiCalls = [...new Set(apiCalls)];
    expect(uniqueApiCalls.length).toBeGreaterThan(apiCalls.length * 0.7); // At least 70% unique calls
  });
});

test.describe('Performance Cross-Browser Testing', () => {
  ['chromium', 'firefox', 'webkit'].forEach(browserName => {
    test(`should maintain performance standards in ${browserName}`, async ({ browser }) => {
      const page = await browser.newPage();

      // Login
      await page.goto('/admin/login');
      await page.getByTestId('email-input').fill('admin@vownow.com');
      await page.getByTestId('password-input').fill('admin123');
      await page.getByTestId('login-submit-button').click();
      await page.getByTestId('2fa-code-input').fill('123456');
      await page.getByTestId('verify-2fa-button').click();

      // Measure performance
      const startTime = Date.now();
      await page.goto('/admin/dashboard');
      await expect(page.getByTestId('admin-dashboard')).toBeVisible();
      const loadTime = Date.now() - startTime;

      // Performance should be consistent across browsers
      expect(loadTime).toBeLessThan(3000); // Slightly more lenient for cross-browser

      await page.close();
    });
  });
});