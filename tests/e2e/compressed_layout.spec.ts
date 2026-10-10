import { expect, test } from '@playwright/test';
import { gzipSync } from 'node:zlib';
import { decodeLayoutString } from './layout_serialization';

test.beforeEach(async ({ page }) => {
  await page.goto('/ui');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.waitForLoadState('networkidle');
});

test('gzip export and Quick Copy preserve the same layout', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.locator('#add-axis-btn').click();
  await expect(page.locator('.draggable')).toHaveCount(1);
  await page.getByRole('button', { name: 'Import/Export' }).click();
  const modal = page.locator('.import-export-modal');
  const textarea = modal.locator('textarea');
  await expect(textarea).toHaveValue(/^ppd1:/);
  const serialized = await textarea.inputValue();
  const layout = decodeLayoutString(serialized);
  expect(layout.elements[0].id).toBe('axis-0');
  await modal.getByRole('button', { name: 'Close' }).click();

  await page.getByRole('button', { name: 'Quick Copy' }).click();
  await expect(page.locator('#status-text')).toContainText('Copied Python import snippet');
  const snippet = await page.evaluate(() => navigator.clipboard.readText());
  expect(snippet).toContain('make_figure_from_b64(import_string)');
  const copied = snippet.match(/import_string = "([^"]+)"/)?.[1];
  expect(copied).toMatch(/^ppd1:/);
  expect(decodeLayoutString(copied!)).toEqual(layout);

  await page.getByRole('button', { name: 'Reset' }).click();
  await expect(page.locator('.draggable')).toHaveCount(0);
  await page.getByRole('button', { name: 'Import/Export' }).click();
  await textarea.fill(serialized);
  await modal.getByRole('button', { name: 'Import', exact: true }).click();
  await expect(modal).toHaveCount(0);
  await expect(page.locator('.draggable[data-id="axis-0"]')).toHaveCount(1);
});

test('imports independently compressed UTF-8 layout and rejects damaged strings', async ({ page }) => {
  const payload = {
    elements: [{ id: 'custom-axis', type: 'axis', x: 0.2, y: 0.3,
      width: 1, height: 1, text: '温度' }],
    constraints: [], constants: [],
    viewport: { figureWidth: 6, figureHeight: 4, scale: 120 }
  };
  const serialized = 'ppd1:' + gzipSync(Buffer.from(JSON.stringify(payload))).toString('base64');
  await page.getByRole('button', { name: 'Import/Export' }).click();
  const modal = page.locator('.import-export-modal');
  await modal.locator('textarea').fill(serialized);
  await modal.getByRole('button', { name: 'Import', exact: true }).click();
  await expect(page.locator('.draggable[data-id="custom-axis"]')).toHaveText('温度');
  await expect(modal).toHaveCount(0);

  await page.getByRole('button', { name: 'Import/Export' }).click();
  await expect(modal.locator('textarea')).toHaveValue(/^ppd1:/);
  expect(decodeLayoutString(await modal.locator('textarea').inputValue()).elements)
    .toEqual(payload.elements);
  await modal.locator('textarea').fill('ppd1:not-valid-gzip');
  page.once('dialog', async dialog => {
    expect(dialog.message()).toContain('Invalid layout string');
    await dialog.accept();
  });
  await modal.getByRole('button', { name: 'Import', exact: true }).click();
  await expect(modal.getByRole('button', { name: 'Import', exact: true })).toBeEnabled();
  await expect(modal).toBeVisible();
  await expect(page.locator('.draggable[data-id="custom-axis"]')).toHaveText('温度');
});

test('server export failure is visible and the modal still allows import', async ({ page }) => {
  await page.route('**/api/export_layout', route => route.fulfill({
    status: 500, contentType: 'application/json', body: JSON.stringify({ detail: 'Export unavailable' })
  }));
  await page.getByRole('button', { name: 'Import/Export' }).click();
  await expect(page.locator('#status-text')).toContainText('Export unavailable');
  await expect(page.locator('.import-export-modal textarea')).toBeEditable();
  await expect(page.locator('.import-export-modal').getByRole('button', { name: 'Import', exact: true }))
    .toBeEnabled();
});
