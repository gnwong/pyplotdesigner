import { expect, type Page } from '@playwright/test';

type ElementSelector =
  | { by: 'alias'; value: string }
  | { by: 'id'; value: string }
  | { by: 'text'; value: string };

type ConstraintSource = ElementSelector | { by: 'constant'; value: string };

export type ActionStep =
  | { kind: 'reset' }
  | { kind: 'addAxis'; times?: number; alias?: string }
  | { kind: 'addConstant'; alias?: string }
  | { kind: 'selectElementList'; target: ElementSelector }
  | { kind: 'selectElementCanvas'; target: ElementSelector }
  | { kind: 'selectConstantList'; target: { by: 'alias' | 'id'; value: string } }
  | { kind: 'renameSelected'; prop: 'text' | 'id' | 'value'; value: string }
  | { kind: 'clickPresetConstraint'; name: 'Match Width' | 'Match Height' | 'Align Left' | 'Align Bottom' }
  | { kind: 'addConstraint'; targetAttr: 'x' | 'y' | 'width' | 'height'; source: ConstraintSource; sourceAttr?: string }
  | { kind: 'assertStatusText'; text: string }
  | { kind: 'assertCounts'; elements?: number; constants?: number; constraints?: number };

export type ActionScenario = {
  name: string;
  actions: ActionStep[];
  expectedExport: string;
};

type RunnerContext = {
  aliases: Map<string, string>;
};

const LAYOUT_UPDATE_TIMEOUT_MS = 10_000;

async function clearStorageAndLoad(page: Page): Promise<void> {
  await page.goto('/ui');
  await page.evaluate(() => {
    localStorage.clear();
    localStorage.setItem('autosave-enabled', 'false');
  });
  await page.reload();
}

function resolveId(ctx: RunnerContext, selector: ElementSelector | { by: 'alias' | 'id'; value: string }): string {
  if (selector.by === 'alias') {
    const mapped = ctx.aliases.get(selector.value);
    expect(mapped, `Missing alias "${selector.value}"`).toBeTruthy();
    return mapped as string;
  }
  return selector.value;
}

async function aliasLastElement(page: Page, ctx: RunnerContext, alias: string): Promise<void> {
  const id = await page.locator('.draggable').last().getAttribute('data-id');
  expect(id, `Unable to resolve latest element id for alias "${alias}"`).toBeTruthy();
  ctx.aliases.set(alias, id as string);
}

async function aliasLastConstant(page: Page, ctx: RunnerContext, alias: string): Promise<void> {
  const id = await page.evaluate(() => {
    const constants = (window as unknown as { constants?: Array<{ id: string }> }).constants || [];
    return constants.length > 0 ? constants[constants.length - 1].id : null;
  });
  expect(id, `Unable to resolve latest constant id for alias "${alias}"`).toBeTruthy();
  ctx.aliases.set(alias, id as string);
}

async function clickElementListById(page: Page, id: string): Promise<void> {
  const clicked = await page.evaluate((elementId) => {
    const runtime = window as unknown as { elements?: Array<{ id: string }> };
    const elements = runtime.elements || [];
    const index = elements.findIndex((el) => el.id === elementId);
    if (index < 0) {
      return false;
    }
    const items = document.querySelectorAll('#elements-list .list-item');
    const item = items[index] as HTMLElement | undefined;
    if (!item) {
      return false;
    }
    item.click();
    return true;
  }, id);
  expect(clicked, `Failed to click element "${id}" in list`).toBeTruthy();
}

async function clickConstantListById(page: Page, id: string): Promise<void> {
  const clicked = await page.evaluate((constantId) => {
    const runtime = window as unknown as { constants?: Array<{ id: string }> };
    const constants = runtime.constants || [];
    const index = constants.findIndex((c) => c.id === constantId);
    if (index < 0) {
      return false;
    }
    const items = document.querySelectorAll('#constants-list .list-item');
    const item = items[index] as HTMLElement | undefined;
    if (!item) {
      return false;
    }
    item.click();
    return true;
  }, id);
  expect(clicked, `Failed to click constant "${id}" in list`).toBeTruthy();
}

async function clickElementCanvas(page: Page, id: string): Promise<void> {
  await page.locator(`.draggable[data-id="${id}"]`).click({ force: true });
}

async function selectElement(page: Page, ctx: RunnerContext, target: ElementSelector, via: 'list' | 'canvas'): Promise<void> {
  if (target.by === 'text') {
    if (via === 'canvas') {
      await page.locator('.draggable', { hasText: target.value }).first().click();
      return;
    }
    await page.locator('#elements-list .list-item').filter({ hasText: target.value }).first().click();
    return;
  }

  const id = resolveId(ctx, target);
  if (via === 'canvas') {
    await clickElementCanvas(page, id);
  } else {
    await clickElementListById(page, id);
  }
}

async function renameSelected(page: Page, prop: 'text' | 'id' | 'value', value: string): Promise<void> {
  const input = page.locator(`#props input[data-prop="${prop}"]`);
  await expect(input).toBeVisible();
  await input.fill(value);
  await page.keyboard.press('Tab');
  await expect(input).toHaveValue(value);
}

async function addConstraint(
  page: Page,
  ctx: RunnerContext,
  step: Extract<ActionStep, { kind: 'addConstraint' }>
): Promise<void> {
  const labelByAttr: Record<typeof step.targetAttr, string> = {
    x: 'X',
    y: 'Y',
    width: 'Width',
    height: 'Height',
  };
  const row = page.locator('.prop-block').filter({
    has: page.locator('.prop-header label', { hasText: labelByAttr[step.targetAttr] }),
  });
  await row.getByRole('button', { name: 'Add Constraint' }).click();

  if ('sourceAttr' in step && step.sourceAttr) {
    page.once('dialog', async (dialog) => {
      await dialog.accept(step.sourceAttr);
    });
  }

  await page
    .locator('#source-constraint-editor-input')
    .locator('xpath=following-sibling::button[normalize-space()="Select"]')
    .click();

  if (step.source.by === 'constant') {
    const constantId = ctx.aliases.get(step.source.value) ?? step.source.value;
    await clickConstantListById(page, constantId);
  } else {
    const sourceId = step.source.by === 'text' ? null : resolveId(ctx, step.source);
    if (sourceId) {
      await clickElementListById(page, sourceId);
    } else {
      await page.locator('#elements-list .list-item').filter({ hasText: step.source.value }).first().click();
    }
  }

  await page.getByRole('button', { name: 'Apply' }).click();
}

async function exportLayout(page: Page): Promise<string> {
  await page.getByRole('button', { name: 'Import/Export' }).click();
  const modal = page.locator('.import-export-modal');
  await expect(modal).toBeVisible();
  const serialized = await modal.locator('.import-export-textarea').inputValue();
  await modal.getByRole('button', { name: 'Close' }).click();
  await expect(modal).toHaveCount(0);
  return serialized;
}

function isLayoutUpdateResponse(url: string, method: string): boolean {
  return method === 'POST' && url.includes('/api/update_layout');
}

async function runAndWaitForLayoutUpdate(page: Page, action: () => Promise<void>): Promise<void> {
  const updatePromise = page.waitForResponse(
    (response) => isLayoutUpdateResponse(response.url(), response.request().method()),
    { timeout: LAYOUT_UPDATE_TIMEOUT_MS }
  );
  await action();
  await updatePromise;
}

export async function runActionScenario(page: Page, scenario: ActionScenario): Promise<string> {
  const ctx: RunnerContext = {
    aliases: new Map<string, string>(),
  };
  let awaitingPresetSelection = false;

  await clearStorageAndLoad(page);

  for (const step of scenario.actions) {
    if (step.kind === 'reset') {
      await page.getByRole('button', { name: 'Reset' }).click();
      continue;
    }
    if (step.kind === 'addAxis') {
      const times = step.times ?? 1;
      for (let i = 0; i < times; i += 1) {
        await runAndWaitForLayoutUpdate(page, async () => {
          await page.locator('#add-axis-btn').click();
        });
      }
      if (step.alias) {
        await aliasLastElement(page, ctx, step.alias);
      }
      continue;
    }
    if (step.kind === 'addConstant') {
      await runAndWaitForLayoutUpdate(page, async () => {
        await page.locator('#add-variable-btn').click();
      });
      if (step.alias) {
        await aliasLastConstant(page, ctx, step.alias);
      }
      continue;
    }
    if (step.kind === 'selectElementList') {
      if (awaitingPresetSelection) {
        await runAndWaitForLayoutUpdate(page, async () => {
          await selectElement(page, ctx, step.target, 'list');
        });
        awaitingPresetSelection = false;
      } else {
        await selectElement(page, ctx, step.target, 'list');
      }
      continue;
    }
    if (step.kind === 'selectElementCanvas') {
      if (awaitingPresetSelection) {
        await runAndWaitForLayoutUpdate(page, async () => {
          await selectElement(page, ctx, step.target, 'canvas');
        });
        awaitingPresetSelection = false;
      } else {
        await selectElement(page, ctx, step.target, 'canvas');
      }
      continue;
    }
    if (step.kind === 'selectConstantList') {
      await clickConstantListById(page, resolveId(ctx, step.target));
      continue;
    }
    if (step.kind === 'renameSelected') {
      await runAndWaitForLayoutUpdate(page, async () => {
        await renameSelected(page, step.prop, step.value);
      });
      continue;
    }
    if (step.kind === 'clickPresetConstraint') {
      await page.getByRole('button', { name: step.name }).click();
      awaitingPresetSelection = true;
      continue;
    }
    if (step.kind === 'addConstraint') {
      await runAndWaitForLayoutUpdate(page, async () => {
        await addConstraint(page, ctx, step);
      });
      continue;
    }
    if (step.kind === 'assertStatusText') {
      await expect(page.locator('#status-text')).toHaveText(`Status: ${step.text}`);
      continue;
    }
    if (step.kind === 'assertCounts') {
      // Let the queued layout update requests settle before checking rendered counts.
      await page.waitForLoadState('networkidle');
      if (typeof step.elements === 'number') {
        await expect(page.locator('.draggable')).toHaveCount(step.elements);
      }
      if (typeof step.constants === 'number') {
        await expect(page.locator('#constants-list .list-item')).toHaveCount(step.constants);
      }
      if (typeof step.constraints === 'number') {
        await expect
          .poll(
            () =>
              page.evaluate(() => {
                return document.querySelectorAll('#constraints-list .list-item').length;
              }),
            { timeout: 10_000 }
          )
          .toBe(step.constraints);
      }
    }
  }

  return exportLayout(page);
}
