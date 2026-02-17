import { expect, test } from '@playwright/test';

test('reference layout snapshot', async ({ page }) => {
  await page.goto('/ui');

  await page.evaluate(() => localStorage.clear());
  await page.reload();

  await page.getByRole('button', { name: 'Reset' }).click();
  await expect(page.locator('.draggable')).toHaveCount(0);

  await page.locator('#add-axis-btn').click();
  await expect(page.locator('.draggable')).toHaveCount(1);
  await page.locator('#add-axis-btn').click();
  await expect(page.locator('.draggable')).toHaveCount(2);

  await page.setViewportSize({ width: 1400, height: 900 });

  await expect(page).toHaveScreenshot('layout-reference.png', {
    fullPage: true,
    animations: 'disabled',
    caret: 'hide',
  });
});

test('reference layout snapshot with one selected axis', async ({ page }) => {
  await page.goto('/ui');

  await page.evaluate(() => localStorage.clear());
  await page.reload();

  await page.getByRole('button', { name: 'Reset' }).click();
  await expect(page.locator('.draggable')).toHaveCount(0);

  await page.locator('#add-axis-btn').click();
  await expect(page.locator('.draggable')).toHaveCount(1);

  await page.locator('#elements-list .list-item').first().click();
  await expect(page.locator('#props input[data-prop="text"]')).toBeVisible();

  await page.setViewportSize({ width: 1400, height: 900 });

  await expect(page).toHaveScreenshot('layout-reference-selected-axis.png', {
    fullPage: true,
    animations: 'disabled',
    caret: 'hide',
  });
});
