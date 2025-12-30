/**
 * E2E Tests for Authentication Flow
 * 
 * Tests login, logout, and protected route access.
 */

import { test, expect } from '@playwright/test';

// Test credentials
const TEST_USER = {
  username: 'admin',
  password: 'DAP123!!!',
};

test.describe('Authentication', () => {
  test.beforeEach(async ({ page }) => {
    // Clear any existing session
    await page.context().clearCookies();
  });

  test('should display login page when not authenticated', async ({ page }) => {
    await page.goto('/');
    
    // Should redirect to login or show login form
    await expect(page.getByRole('heading', { name: /login|sign in/i })).toBeVisible();
  });

  test('should login with valid credentials', async ({ page }) => {
    await page.goto('/');
    
    // Fill login form
    await page.getByLabel(/username|email/i).fill(TEST_USER.username);
    await page.getByLabel(/password/i).fill(TEST_USER.password);
    
    // Submit
    await page.getByRole('button', { name: /login|sign in/i }).click();
    
    // Should redirect to dashboard or main page
    await expect(page).toHaveURL(/.*dashboard|products|solutions/i, { timeout: 10000 });
  });

  test('should show error with invalid credentials', async ({ page }) => {
    await page.goto('/');
    
    // Fill login form with wrong password
    await page.getByLabel(/username|email/i).fill(TEST_USER.username);
    await page.getByLabel(/password/i).fill('wrongpassword');
    
    // Submit
    await page.getByRole('button', { name: /login|sign in/i }).click();
    
    // Should show error message
    await expect(page.getByText(/invalid|incorrect|failed/i)).toBeVisible();
  });

  test('should logout successfully', async ({ page }) => {
    // First login
    await page.goto('/');
    await page.getByLabel(/username|email/i).fill(TEST_USER.username);
    await page.getByLabel(/password/i).fill(TEST_USER.password);
    await page.getByRole('button', { name: /login|sign in/i }).click();
    
    // Wait for redirect
    await page.waitForURL(/.*dashboard|products|solutions/i, { timeout: 10000 });
    
    // Find and click logout (usually in a menu)
    // Try different selectors for logout
    const logoutButton = page.getByRole('button', { name: /logout|sign out/i });
    const userMenu = page.getByRole('button', { name: /user|profile|account/i });
    
    if (await userMenu.isVisible()) {
      await userMenu.click();
      await page.getByRole('menuitem', { name: /logout|sign out/i }).click();
    } else if (await logoutButton.isVisible()) {
      await logoutButton.click();
    }
    
    // Should be redirected to login
    await expect(page.getByRole('heading', { name: /login|sign in/i })).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Protected Routes', () => {
  test('should redirect to login when accessing protected route without auth', async ({ page }) => {
    // Clear cookies first
    await page.context().clearCookies();
    
    // Try to access protected route
    await page.goto('/products');
    
    // Should redirect to login
    await expect(page.getByRole('heading', { name: /login|sign in/i })).toBeVisible({ timeout: 10000 });
  });

  test('should access protected route after authentication', async ({ page }) => {
    // Login first
    await page.goto('/');
    await page.getByLabel(/username|email/i).fill(TEST_USER.username);
    await page.getByLabel(/password/i).fill(TEST_USER.password);
    await page.getByRole('button', { name: /login|sign in/i }).click();
    
    // Wait for login to complete
    await page.waitForURL(/.*dashboard|products|solutions/i, { timeout: 10000 });
    
    // Navigate to products
    await page.goto('/products');
    
    // Should see products page content
    await expect(page.getByRole('heading', { name: /products/i })).toBeVisible();
  });
});

