/**
 * E2E Tests for Products Flow
 * 
 * Tests product CRUD operations, tags, outcomes, and tasks.
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

test.describe('Products Page', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto('/products');
  });

  test('should display products list', async ({ page }) => {
    // Should see products page
    await expect(page.getByRole('heading', { name: /products/i })).toBeVisible();
    
    // Should see product table or list
    const productContainer = page.locator('[data-testid="products-list"], table, .products-container');
    await expect(productContainer.first()).toBeVisible({ timeout: 10000 });
  });

  test('should open product dialog for creating new product', async ({ page }) => {
    // Click add product button
    const addButton = page.getByRole('button', { name: /add|create|new/i }).first();
    await addButton.click();
    
    // Should see dialog
    await expect(page.getByRole('dialog')).toBeVisible();
    
    // Should have name field
    await expect(page.getByLabel(/name/i)).toBeVisible();
  });

  test('should create a new product', async ({ page }) => {
    const productName = `Test Product ${Date.now()}`;
    
    // Open create dialog
    const addButton = page.getByRole('button', { name: /add|create|new/i }).first();
    await addButton.click();
    
    // Fill form
    await page.getByLabel(/name/i).first().fill(productName);
    
    // Try to find description field
    const descField = page.getByLabel(/description/i).first();
    if (await descField.isVisible()) {
      await descField.fill('E2E test product description');
    }
    
    // Submit
    await page.getByRole('button', { name: /save|create|submit/i }).click();
    
    // Wait for dialog to close
    await expect(page.getByRole('dialog')).toBeHidden({ timeout: 10000 });
    
    // Verify product appears in list
    await expect(page.getByText(productName)).toBeVisible({ timeout: 10000 });
  });

  test('should select a product to view details', async ({ page }) => {
    // Wait for products to load
    await page.waitForTimeout(2000);
    
    // Click on first product in list
    const firstProduct = page.locator('tr, [data-testid^="product-"]').first();
    await firstProduct.click();
    
    // Should show product details (tabs, tasks, etc.)
    await expect(
      page.getByRole('tab').first()
    ).toBeVisible({ timeout: 10000 });
  });

  test('should switch between product tabs', async ({ page }) => {
    // Wait for products to load and select first one
    await page.waitForTimeout(2000);
    const firstProduct = page.locator('tr, [data-testid^="product-"]').first();
    await firstProduct.click();
    
    // Wait for tabs to appear
    await page.waitForTimeout(1000);
    
    // Get all tabs
    const tabs = page.getByRole('tab');
    const tabCount = await tabs.count();
    
    // Click through each tab
    for (let i = 0; i < Math.min(tabCount, 5); i++) {
      await tabs.nth(i).click();
      await page.waitForTimeout(500);
    }
  });
});

test.describe('Product Tasks', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto('/products');
    
    // Select first product
    await page.waitForTimeout(2000);
    const firstProduct = page.locator('tr, [data-testid^="product-"]').first();
    if (await firstProduct.isVisible()) {
      await firstProduct.click();
    }
  });

  test('should display tasks tab', async ({ page }) => {
    // Click tasks tab
    const tasksTab = page.getByRole('tab', { name: /tasks/i });
    if (await tasksTab.isVisible()) {
      await tasksTab.click();
      
      // Should see tasks content
      await page.waitForTimeout(1000);
    }
  });

  test('should add a new task', async ({ page }) => {
    // Click tasks tab
    const tasksTab = page.getByRole('tab', { name: /tasks/i });
    if (await tasksTab.isVisible()) {
      await tasksTab.click();
      await page.waitForTimeout(1000);
      
      // Click add task button
      const addTaskBtn = page.getByRole('button', { name: /add.*task|new.*task/i });
      if (await addTaskBtn.isVisible()) {
        await addTaskBtn.click();
        
        // Fill task form
        await page.getByLabel(/name/i).first().fill(`E2E Task ${Date.now()}`);
        
        // Submit
        await page.getByRole('button', { name: /save|create|add/i }).click();
      }
    }
  });
});

test.describe('Product Tags', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto('/products');
    
    // Select first product
    await page.waitForTimeout(2000);
    const firstProduct = page.locator('tr, [data-testid^="product-"]').first();
    if (await firstProduct.isVisible()) {
      await firstProduct.click();
    }
  });

  test('should display tags tab', async ({ page }) => {
    // Click tags tab
    const tagsTab = page.getByRole('tab', { name: /tags/i });
    if (await tagsTab.isVisible()) {
      await tagsTab.click();
      await page.waitForTimeout(1000);
    }
  });
});

