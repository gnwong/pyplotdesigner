import { expect, test } from '@playwright/test';

test('reset clears layout elements, constants, and saved state', async ({ page }) => {
  await page.goto('/ui');

  await page.evaluate(() => localStorage.clear());
  await page.evaluate(() => localStorage.setItem('autosave-enabled', 'true'));
  await page.reload();

  const autosaveToggle = page.locator('#autosave-toggle');
  await expect(autosaveToggle).toHaveText('Autosave: ON');

  await page.locator('#add-axis-btn').click();
  await expect(page.locator('.draggable')).toHaveCount(1);
  await page.locator('#add-variable-btn').click();
  await expect(page.locator('#constants-list .list-item')).toHaveCount(1);
  await expect
    .poll(async () =>
      page.evaluate(() => localStorage.getItem('pyplotdesigner-state'))
    )
    .not.toBeNull();

  await page.getByRole('button', { name: 'Reset' }).click();

  await expect(page.locator('.draggable')).toHaveCount(0);
  await expect(page.locator('#constants-list .list-item')).toHaveCount(0);
  await expect(page.locator('#constraints-list .list-item')).toHaveCount(0);
  await expect
    .poll(async () =>
      page.evaluate(() => localStorage.getItem('pyplotdesigner-state'))
    )
    .toBeNull();
});
