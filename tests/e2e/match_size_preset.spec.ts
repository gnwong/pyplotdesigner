import { expect, test } from '@playwright/test';

test('match-dimensions preset adds width and height constraints from selected source axis', async ({ page }) => {
  await page.goto('/ui');

  await page.evaluate(() => localStorage.clear());
  await page.reload();

  await page.getByRole('button', { name: 'Reset' }).click();
  await expect(page.locator('.draggable')).toHaveCount(0);

  await page.locator('#add-axis-btn').click();
  await page.locator('#add-axis-btn').click();
  await expect(page.locator('#elements-list .list-item')).toHaveCount(2);
  await expect(page.locator('#constraints-list .list-item')).toHaveCount(0);

  await page.locator('#elements-list .list-item').first().click();
  await page.getByRole('button', { name: 'Match Dimensions' }).click();
  await expect(page.locator('#status-text')).toHaveText('Status: Waiting for input: select element to match dimensions.');

  await page.locator('#elements-list .list-item').nth(1).click();

  await expect(page.locator('#constraints-list .list-item')).toHaveCount(2);
  await expect(page.locator('#status-text')).toHaveText('Status: Ready');
});
