// Runs the same checks as tests.html, plus page-level smoke tests, in headless Chrome.
import { test, expect } from '@playwright/test';

// Fail any test whose page throws an uncaught error.
const watchErrors = page => {
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  return errors;
};

test('game checks pass (levels, taming, trader, herd, saves)', async ({ page }) => {
  const errors = watchErrors(page);
  await page.goto('/tests.html');
  await page.waitForFunction(() => window.rizqTests);
  const fails = await page.evaluate(() => window.rizqTests.runChecks());
  const report = await page.locator('#out').innerText();
  expect(fails, report).toBe(0);
  expect(errors).toEqual([]);
});

test('a bot can play several depths without errors', async ({ page }) => {
  const errors = watchErrors(page);
  await page.goto('/tests.html');
  await page.waitForFunction(() => window.rizqTests);
  const results = await page.evaluate(() => window.rizqTests.runBalance(2, 4000));
  for (const r of results) {
    expect(r.err, `seed ${r.seed}`).toBeNull();
    expect(r.deepest, `seed ${r.seed} should get past the first depths`).toBeGreaterThan(2);
  }
  expect(errors).toEqual([]);
});

test('title screen, new run and auto-explore work on desktop', async ({ page }) => {
  const errors = watchErrors(page);
  await page.goto('/');
  await expect(page.locator('#title')).toBeVisible();
  await page.locator('#btnNew').click();
  await expect(page.locator('#title')).toBeHidden();
  await page.keyboard.press('x');
  await page.waitForTimeout(1500);
  const turn = await page.evaluate(() => G.turn);
  expect(turn).toBeGreaterThan(0);
  await page.keyboard.press('i');
  await expect(page.locator('#inv')).toBeVisible();
  await page.keyboard.press('Escape');
  expect(errors).toEqual([]);
});

test('phone layout: touch pad shows and the page never scrolls sideways', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 375, height: 812 }, hasTouch: true, isMobile: true });
  const page = await context.newPage();
  const errors = watchErrors(page);
  await page.goto('/');
  await page.locator('#btnNew').tap();
  await expect(page.locator('#pad')).toBeVisible();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(0);
  await page.locator('#pad [data-a="explore"]').tap();
  await page.waitForTimeout(1000);
  expect(errors).toEqual([]);
  await context.close();
});
