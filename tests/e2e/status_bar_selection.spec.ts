import { expect, test } from '@playwright/test';

test('match-width enters waiting mode in status bar until a source element is selected', async ({ page }) => {
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
  await page.getByRole('button', { name: 'Match Width' }).click();

  await expect(page.locator('#status-text')).toHaveText('Status: Waiting for input: select element to match width.');
  await expect(page.locator('#status-action')).toBeVisible();
  await expect(page.locator('#status-action')).toHaveText('Cancel');

  await page.locator('#elements-list .list-item').nth(1).click();

  await expect(page.locator('#constraints-list .list-item')).toHaveCount(1);
  await expect(page.locator('#status-text')).toHaveText('Status: Ready');
  await expect(page.locator('#status-action')).toBeHidden();
});
