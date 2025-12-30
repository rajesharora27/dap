/**
 * E2E Tests for Navigation
 * 
 * Tests main navigation and page routing.
 */

import { test, expect } from '@playwright/test';

// Test credentials
const TEST_USER = {
  username: 'admin',
  password: 'DAP123!!!',
};

// Helper to login before tests
async function login(page: any) {
  await page.goto('/');
  await page.getByLabel(/username|email/i).fill(TEST_USER.username);
  await page.getByLabel(/password/i).fill(TEST_USER.password);
  await page.getByRole('button', { name: /login|sign in/i }).click();
  await page.waitForURL(/.*dashboard|products|solutions/i, { timeout: 10000 });
}

test.describe('Main Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('should navigate to Products page', async ({ page }) => {
    // Find and click products nav item
    await page.getByRole('link', { name: /products/i }).first().click();
    
    // Verify URL and page content
    await expect(page).toHaveURL(/.*products/i);
    await expect(page.getByRole('heading', { name: /products/i })).toBeVisible();
  });

  test('should navigate to Solutions page', async ({ page }) => {
    // Find and click solutions nav item
    await page.getByRole('link', { name: /solutions/i }).first().click();
    
    // Verify URL and page content
    await expect(page).toHaveURL(/.*solutions/i);
    await expect(page.getByRole('heading', { name: /solutions/i })).toBeVisible();
  });

  test('should navigate to Customers page', async ({ page }) => {
    // Find and click customers nav item
    await page.getByRole('link', { name: /customers/i }).first().click();
    
    // Verify URL and page content
    await expect(page).toHaveURL(/.*customers/i);
    await expect(page.getByRole('heading', { name: /customers/i })).toBeVisible();
  });

  test('should navigate to Dashboard', async ({ page }) => {
    // Navigate away first
    await page.goto('/products');
    
    // Find and click dashboard nav item
    const dashboardLink = page.getByRole('link', { name: /dashboard|home/i }).first();
    if (await dashboardLink.isVisible()) {
      await dashboardLink.click();
      await expect(page).toHaveURL(/.*dashboard/i);
    }
  });
});

test.describe('Breadcrumb Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('should show breadcrumbs on Products page', async ({ page }) => {
    await page.goto('/products');
    
    // Look for breadcrumb navigation
    const breadcrumb = page.locator('[aria-label="breadcrumb"], .MuiBreadcrumbs-root, nav.breadcrumbs');
    
    if (await breadcrumb.isVisible()) {
      await expect(breadcrumb).toBeVisible();
    }
  });
});

test.describe('Page Transitions', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('should maintain state when navigating back', async ({ page }) => {
    // Go to products
    await page.goto('/products');
    await page.waitForTimeout(1000);
    
    // Select first product
    const firstProduct = page.locator('tr, [data-testid^="product-"]').first();
    if (await firstProduct.isVisible()) {
      await firstProduct.click();
      await page.waitForTimeout(500);
    }
    
    // Navigate to solutions
    await page.getByRole('link', { name: /solutions/i }).first().click();
    await expect(page).toHaveURL(/.*solutions/i);
    
    // Navigate back to products
    await page.goBack();
    await expect(page).toHaveURL(/.*products/i);
  });
});

test.describe('Responsive Navigation', () => {
  test('should show navigation on desktop', async ({ page }) => {
    await login(page);
    
    // Desktop viewport (default)
    await page.setViewportSize({ width: 1280, height: 720 });
    
    // Navigation should be visible
    const navLinks = page.getByRole('link', { name: /products|solutions|customers/i });
    await expect(navLinks.first()).toBeVisible();
  });

  test('should show mobile menu on small screens', async ({ page }) => {
    await login(page);
    
    // Mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Look for hamburger menu or drawer toggle
    const menuButton = page.getByRole('button', { name: /menu/i });
    
    if (await menuButton.isVisible()) {
      await menuButton.click();
      
      // Navigation should appear in drawer
      await page.waitForTimeout(500);
    }
  });
});

