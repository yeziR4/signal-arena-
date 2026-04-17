const { test, expect } = require('@playwright/test');

const APP_URL = 'http://localhost:3000';

test.describe('Signal Arena - Production Functional Tests', () => {
  // Test 1: Landing page
  test('Flow 1: Landing page renders meaningful content', async ({ page }) => {
    await page.goto(APP_URL);
    await expect(page).toHaveTitle(/Signal Arena/);
    
    // Check main headings
    await expect(page.locator('text=Market Discovery').first()).toBeVisible();
    await expect(page.locator('text=Manually Resolve Asset').first()).toBeVisible();
    await expect(page.locator('text=Live Market Feed').first()).toBeVisible();
    
    // Check main navigation links
    const header = page.locator('header');
    await expect(header.locator('text=Signal Arena')).toBeVisible();
  });

  // Test 2: Search / discovery flow
  test('Flow 2: Search / discovery flow is interactive', async ({ page }) => {
    await page.goto(`${APP_URL}/search`);
    
    // Check search input exists
    const searchInput = page.locator('input').first();
    await expect(searchInput).toBeVisible();
    
    // Type and interact
    await searchInput.fill('AAPL');
    const resolveButton = page.locator('button', { hasText: 'Resolve Search' });
    if(await resolveButton.isVisible()) {
       await resolveButton.click();
    } else {
       await page.locator('button', { hasText: 'Resolve' }).click();
    }
    
    // Verify it navigates or shows the asset header
    await expect(page.locator('h2', { hasText: 'Apple Inc' }).first().or(page.locator('span', { hasText: 'AAPL' }).first())).toBeVisible({ timeout: 10000 });
  });

  // Test 3: Arena-style asset evaluation flow
  test('Flow 3: Arena-style asset evaluation completes or fails cleanly', async ({ page }) => {
    await page.goto(`${APP_URL}/search`);
    // Need to trigger a resolution to see the AI output.
    const searchInput = page.locator('input').first();
    await searchInput.fill('AAPL');
    await page.locator('button', { hasText: 'Resolve' }).click();
    
    // Wait for asset page to load
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 10000 });
    
    // Try to trigger evaluation
    const evaluateButton = page.locator('button', { hasText: /BET|EVALUATE|Resolve Asset/i }).first();
    if(await evaluateButton.isVisible()) {
      await evaluateButton.click();
      
      // Wait for AI response or error
      // Test should catch visible loading state or network errors
      try {
         await expect(page.locator('text=Neural Reasoning').first().or(page.locator('text=Evaluation').first())).toBeVisible({ timeout: 15000 });
      } catch (e) {
         // If it fails, report the error state instead
         const hasError = await page.locator('text=Error').isVisible(); // Check for error messages
         if(!hasError) throw e;
      }
    }
  });

  // Test 4: Leaderboard / standings
  test('Flow 4: Leaderboard loads and renders trader rows', async ({ page }) => {
    await page.goto(`${APP_URL}/leaderboard`);
    
    await expect(page.locator('text=Arena Leaderboard').first()).toBeVisible();
    
    // Check for podium or rows
    const hasPodium = await page.locator('text=Top 3').isVisible();
    const hasRows = await page.locator('text=% ROI').first().isVisible();
    const hasEmpty = await page.locator('text=No traders yet').isVisible(); // fallback for empty states
    
    expect(hasPodium || hasRows || hasEmpty).toBeTruthy();
  });

  // Test 5: Portfolio / positions
  test('Flow 5: Portfolio page renders', async ({ page }) => {
    await page.goto(`${APP_URL}/portfolio`);
    
    const headingText = await page.locator('h1, h2, h3').allTextContents();
    const hasPortOrPos = headingText.some(text => text.includes('Portfolio') || text.includes('Positions') || text.includes('PORTFOLIO'));
    expect(hasPortOrPos).toBeTruthy();
    // In many anonymous session apps without auth, this might show empty
    const hasPositions = await page.locator('text=Current Positions').isVisible() || await page.locator('text=Total PnL').isVisible();
    const hasEmptyState = await page.locator('text=No positions').isVisible() || await page.locator('main').locator('text=0').first().isVisible();
    
    expect(hasPositions || hasEmptyState).toBeTruthy();
  });

  // Test 6: Error handling
  test('Flow 6: Proper error messages on invalid input', async ({ page }) => {
    await page.goto(`${APP_URL}/search`);
    
    const searchInput = page.locator('input').first();
    await searchInput.fill('INVALID_SYM_123');
    await page.locator('button', { hasText: 'Resolve' }).click();
    
    // Should show an error message
    // If the backend fails properly it should display something
    const hasError = await page.locator('text=Error').isVisible() 
                  || await page.locator('text=not found').isVisible()
                  || await page.locator('text=Failed').isVisible()
                  || await page.locator('text=Invalid').isVisible();
                  
    // We expect an error banner or toast
    expect(await page.locator('body').textContent()).toMatch(/Error|not found|Failed|Invalid|No data/i);
  });

  // Test 7: Responsive / stability checks
  test('Flow 7: Main routes do not white-screen and load correctly', async ({ page }) => {
    const routes = ['/', '/search', '/leaderboard', '/portfolio'];
    for(const route of routes) {
       const response = await page.goto(`${APP_URL}${route}`);
       expect(response.status()).toBeLessThan(500); // Should not 5xx
       const bodyText = await page.textContent('body');
       expect(bodyText.length).toBeGreaterThan(100); // Should not be a blank white screen
    }
  });

});
