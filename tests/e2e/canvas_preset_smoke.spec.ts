import { expect, test } from '@playwright/test';

test('match-width selection can be completed via canvas click', async ({ page }) => {
  await page.goto('/ui');

  await page.evaluate(() => localStorage.clear());
  await page.reload();

  await page.getByRole('button', { name: 'Reset' }).click();
  await expect(page.locator('.draggable')).toHaveCount(0);

  await page.locator('#add-axis-btn').click();
  await page.locator('#add-axis-btn').click();
  await expect(page.locator('#elements-list .list-item')).toHaveCount(2);

  await page.locator('#elements-list .list-item').first().click();
  await page.getByRole('button', { name: 'Match Width' }).click();
  await expect(page.locator('#status-text')).toHaveText('Status: Waiting for input: select element to match width.');

  await page.locator('.draggable').nth(1).click();

  await expect(page.locator('#constraints-list .list-item')).toHaveCount(1);
  await expect(page.locator('#status-text')).toHaveText('Status: Ready');
});
