import { expect, test } from '@playwright/test';

test('reset, add two axes, rename via panel and canvas selection, then rename constant', async ({ page }) => {
  await page.goto('/ui');

  await page.evaluate(() => localStorage.clear());
  await page.reload();

  await page.getByRole('button', { name: 'Reset' }).click();
  await expect(page.locator('.draggable')).toHaveCount(0);

  await page.locator('#add-axis-btn').click();
  await expect(page.locator('.draggable')).toHaveCount(1);
  await page.locator('#add-axis-btn').click();
  await expect(page.locator('.draggable')).toHaveCount(2);

  const axisLabels = (await page.locator('.draggable').allInnerTexts()).map((name) =>
    name.trim()
  );
  const firstAxisName = axisLabels[0];
  const secondAxisName = axisLabels.find((name) => name !== firstAxisName);
  expect(firstAxisName).toBeTruthy();
  expect(secondAxisName).toBeTruthy();

  // Select first axis from the right panel and rename it.
  const firstAxisListItem = page.locator('#elements-list .list-item').filter({
    hasText: firstAxisName as string,
  });
  await firstAxisListItem.click();
  const axisNameInput = page.locator('#props input[data-prop="text"]');
  await expect(axisNameInput).toBeVisible();
  await expect(axisNameInput).toHaveValue(firstAxisName as string);
  await axisNameInput.fill('left_panel');
  await expect(axisNameInput).toHaveValue('left_panel');
  await page.keyboard.press('Tab');
  await expect
    .poll(async () => page.locator('#elements-list').innerText())
    .toContain('left_panel');

  // Select second axis by clicking it on the canvas and rename it.
  await page.locator('.draggable', { hasText: secondAxisName as string }).click();
  await expect(axisNameInput).toBeVisible();
  await expect(axisNameInput).toHaveValue(secondAxisName as string);
  await axisNameInput.fill('right_panel');
  await expect(axisNameInput).toHaveValue('right_panel');
  await page.keyboard.press('Tab');
  await expect
    .poll(async () => page.locator('#elements-list').innerText())
    .toContain('right_panel');
  await expect(page.locator('.draggable', { hasText: 'right_panel' })).toHaveCount(1);

  // Add one constant and rename it from the constants panel.
  await page.locator('#add-variable-btn').click();
  const constantListItem = page.locator('#constants-list .list-item').first();
  await expect(constantListItem).toBeVisible();
  await constantListItem.click();

  const constantNameInput = page.locator('#props input[data-prop="id"]');
  await expect(constantNameInput).toBeVisible();
  await constantNameInput.fill('gap_x');
  await expect(constantNameInput).toHaveValue('gap_x');
  await page.keyboard.press('Tab');

  await expect
    .poll(async () => page.locator('#constants-list').innerText())
    .toContain('gap_x');
});

test('constant edit without intermediate commit does not create duplicate constants', async ({ page }) => {
  await page.goto('/ui');

  await page.evaluate(() => localStorage.clear());
  await page.reload();

  await page.getByRole('button', { name: 'Reset' }).click();
  await page.locator('#add-variable-btn').click();
  await expect(page.locator('#constants-list .list-item')).toHaveCount(1);

  await page.locator('#constants-list .list-item').first().click();

  const constantNameInput = page.locator('#props input[data-prop="id"]');
  const constantValueInput = page.locator('#props input[data-prop="value"]');
  await expect(constantNameInput).toBeVisible();
  await expect(constantValueInput).toBeVisible();

  await constantNameInput.fill('spacing');
  await constantValueInput.click();
  await constantValueInput.fill('0.2');
  await constantValueInput.press('Enter');

  await expect(page.locator('#constants-list .list-item')).toHaveCount(1);
  await expect
    .poll(async () => page.locator('#constants-list').innerText())
    .toContain('spacing = 0.2');
});
