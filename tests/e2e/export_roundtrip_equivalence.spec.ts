import { expect, test } from '@playwright/test';

type LayoutValueRef = {
  id: string | null;
  attr: string | number | null;
};

type LayoutElement = {
  id: string;
  type: string;
  x: number;
  y: number;
  width: number;
  height: number;
  text?: string;
};

type LayoutConstraint = {
  target: LayoutValueRef;
  source: LayoutValueRef;
  multiply: LayoutValueRef;
  add_before: LayoutValueRef;
  add_after: LayoutValueRef;
};

type LayoutConstant = {
  id: string;
  value: number;
};

type LayoutViewport = {
  width: number;
  height: number;
  scale: number;
  figureWidth: number;
  figureHeight: number;
};

type LayoutPayload = {
  elements: LayoutElement[];
  constraints: LayoutConstraint[];
  constants: LayoutConstant[];
  viewport: Partial<LayoutViewport>;
};

type LayoutCommand =
  | {
      kind: 'setViewport';
      viewport: LayoutViewport;
    }
  | {
      kind: 'addElement';
      element: LayoutElement;
    }
  | {
      kind: 'addConstant';
      constant: LayoutConstant;
    }
  | {
      kind: 'addConstraint';
      target: LayoutValueRef;
      source?: LayoutValueRef;
      multiply?: LayoutValueRef;
      addBefore?: LayoutValueRef;
      addAfter?: LayoutValueRef;
    };

const KNOWN_LAYOUT_FROM_PYTHON = 'eyJlbGVtZW50cyI6W3siaWQiOiJwbG90MSIsInR5cGUiOiJheGlzIiwieCI6MC43LCJ5IjowLjUsIndpZHRoIjoxMC4wLCJoZWlnaHQiOjEuMCwidGV4dCI6InBsb3QxIn0seyJpZCI6InBsb3QyIiwidHlwZSI6ImF4aXMiLCJ4IjowLjcsInkiOjIuMCwid2lkdGgiOjEwLjAsImhlaWdodCI6My4wLCJ0ZXh0IjoicGxvdDIifSx7ImlkIjoicGxvdDMiLCJ0eXBlIjoiYXhpcyIsIngiOjAuNywieSI6NS41LCJ3aWR0aCI6Mi44MDAwMDAwMDAwMDAwMDAzLCJoZWlnaHQiOjIuODAwMDAwMDAwMDAwMDAwMywidGV4dCI6InBsb3QzIn0seyJpZCI6InBsb3Q0IiwidHlwZSI6ImF4aXMiLCJ4Ijo0LjMsInkiOjUuNSwid2lkdGgiOjIuODAwMDAwMDAwMDAwMDAwMywiaGVpZ2h0IjoyLjgwMDAwMDAwMDAwMDAwMDMsInRleHQiOiJwbG90NCJ9LHsiaWQiOiJwbG90NSIsInR5cGUiOiJheGlzIiwieCI6Ny44OTk5OTk5OTk5OTk5OTk1LCJ5Ijo1LjUsIndpZHRoIjoyLjgwMDAwMDAwMDAwMDAwMDMsImhlaWdodCI6Mi44MDAwMDAwMDAwMDAwMDAzLCJ0ZXh0IjoicGxvdDUifV0sImNvbnN0cmFpbnRzIjpbeyJ0YXJnZXQiOnsiaWQiOiJwbG90MSIsImF0dHIiOiJ4In0sInNvdXJjZSI6eyJpZCI6bnVsbCwiYXR0ciI6MC43fSwibXVsdGlwbHkiOnsiaWQiOm51bGwsImF0dHIiOjEuMH0sImFkZF9iZWZvcmUiOnsiaWQiOm51bGwsImF0dHIiOjAuMH0sImFkZF9hZnRlciI6eyJpZCI6bnVsbCwiYXR0ciI6MC4wfX0seyJ0YXJnZXQiOnsiaWQiOiJwbG90MSIsImF0dHIiOiJ5In0sInNvdXJjZSI6eyJpZCI6bnVsbCwiYXR0ciI6MC41fSwibXVsdGlwbHkiOnsiaWQiOm51bGwsImF0dHIiOjEuMH0sImFkZF9iZWZvcmUiOnsiaWQiOm51bGwsImF0dHIiOjAuMH0sImFkZF9hZnRlciI6eyJpZCI6bnVsbCwiYXR0ciI6MC4wfX0seyJ0YXJnZXQiOnsiaWQiOiJwbG90MSIsImF0dHIiOiJ3aWR0aCJ9LCJzb3VyY2UiOnsiaWQiOiJzcXVhcmVfcmF0aW8iLCJhdHRyIjpudWxsfSwibXVsdGlwbHkiOnsiaWQiOm51bGwsImF0dHIiOjEuMH0sImFkZF9iZWZvcmUiOnsiaWQiOm51bGwsImF0dHIiOjAuMH0sImFkZF9hZnRlciI6eyJpZCI6bnVsbCwiYXR0ciI6MC4wfX0seyJ0YXJnZXQiOnsiaWQiOiJwbG90MSIsImF0dHIiOiJoZWlnaHQifSwic291cmNlIjp7ImlkIjpudWxsLCJhdHRyIjoxfSwibXVsdGlwbHkiOnsiaWQiOm51bGwsImF0dHIiOjEuMH0sImFkZF9iZWZvcmUiOnsiaWQiOm51bGwsImF0dHIiOjAuMH0sImFkZF9hZnRlciI6eyJpZCI6bnVsbCwiYXR0ciI6MC4wfX0seyJ0YXJnZXQiOnsiaWQiOiJwbG90MiIsImF0dHIiOiJ4In0sInNvdXJjZSI6eyJpZCI6bnVsbCwiYXR0ciI6MC43fSwibXVsdGlwbHkiOnsiaWQiOm51bGwsImF0dHIiOjEuMH0sImFkZF9iZWZvcmUiOnsiaWQiOm51bGwsImF0dHIiOjAuMH0sImFkZF9hZnRlciI6eyJpZCI6bnVsbCwiYXR0ciI6MC4wfX0seyJ0YXJnZXQiOnsiaWQiOiJwbG90MiIsImF0dHIiOiJ3aWR0aCJ9LCJzb3VyY2UiOnsiaWQiOiJzcXVhcmVfcmF0aW8iLCJhdHRyIjpudWxsfSwibXVsdGlwbHkiOnsiaWQiOm51bGwsImF0dHIiOjEuMH0sImFkZF9iZWZvcmUiOnsiaWQiOm51bGwsImF0dHIiOjAuMH0sImFkZF9hZnRlciI6eyJpZCI6bnVsbCwiYXR0ciI6MC4wfX0seyJ0YXJnZXQiOnsiaWQiOiJwbG90MiIsImF0dHIiOiJ5In0sInNvdXJjZSI6eyJpZCI6InBsb3QxIiwiYXR0ciI6InRvcCJ9LCJtdWx0aXBseSI6eyJpZCI6bnVsbCwiYXR0ciI6MS4wfSwiYWRkX2JlZm9yZSI6eyJpZCI6bnVsbCwiYXR0ciI6MC4wfSwiYWRkX2FmdGVyIjp7ImlkIjoidl9zcGFjaW5nIiwiYXR0ciI6bnVsbH19LHsidGFyZ2V0Ijp7ImlkIjoicGxvdDIiLCJhdHRyIjoiaGVpZ2h0In0sInNvdXJjZSI6eyJpZCI6bnVsbCwiYXR0ciI6M30sIm11bHRpcGx5Ijp7ImlkIjpudWxsLCJhdHRyIjoxLjB9LCJhZGRfYmVmb3JlIjp7ImlkIjpudWxsLCJhdHRyIjowLjB9LCJhZGRfYWZ0ZXIiOnsiaWQiOm51bGwsImF0dHIiOjAuMH19LHsidGFyZ2V0Ijp7ImlkIjoicGxvdDMiLCJhdHRyIjoid2lkdGgifSwic291cmNlIjp7ImlkIjpudWxsLCJhdHRyIjoyLjgwMDAwMDAwMDAwMDAwMDN9LCJtdWx0aXBseSI6eyJpZCI6bnVsbCwiYXR0ciI6MS4wfSwiYWRkX2JlZm9yZSI6eyJpZCI6bnVsbCwiYXR0ciI6MC4wfSwiYWRkX2FmdGVyIjp7ImlkIjpudWxsLCJhdHRyIjowLjB9fSx7InRhcmdldCI6eyJpZCI6InBsb3QzIiwiYXR0ciI6ImhlaWdodCJ9LCJzb3VyY2UiOnsiaWQiOiJwbG90MyIsImF0dHIiOiJ3aWR0aCJ9LCJtdWx0aXBseSI6eyJpZCI6bnVsbCwiYXR0ciI6MS4wfSwiYWRkX2JlZm9yZSI6eyJpZCI6bnVsbCwiYXR0ciI6MC4wfSwiYWRkX2FmdGVyIjp7ImlkIjpudWxsLCJhdHRyIjowLjB9fSx7InRhcmdldCI6eyJpZCI6InBsb3QzIiwiYXR0ciI6IngifSwic291cmNlIjp7ImlkIjpudWxsLCJhdHRyIjowLjd9LCJtdWx0aXBseSI6eyJpZCI6bnVsbCwiYXR0ciI6MS4wfSwiYWRkX2JlZm9yZSI6eyJpZCI6bnVsbCwiYXR0ciI6MC4wfSwiYWRkX2FmdGVyIjp7ImlkIjpudWxsLCJhdHRyIjowLjB9fSx7InRhcmdldCI6eyJpZCI6InBsb3QzIiwiYXR0ciI6InkifSwic291cmNlIjp7ImlkIjoicGxvdDIiLCJhdHRyIjoidG9wIn0sIm11bHRpcGx5Ijp7ImlkIjpudWxsLCJhdHRyIjoxLjB9LCJhZGRfYmVmb3JlIjp7ImlkIjpudWxsLCJhdHRyIjowLjB9LCJhZGRfYWZ0ZXIiOnsiaWQiOiJ2X3NwYWNpbmciLCJhdHRyIjpudWxsfX0seyJ0YXJnZXQiOnsiaWQiOiJwbG90NCIsImF0dHIiOiJ3aWR0aCJ9LCJzb3VyY2UiOnsiaWQiOiJwbG90MyIsImF0dHIiOiJ3aWR0aCJ9LCJtdWx0aXBseSI6eyJpZCI6bnVsbCwiYXR0ciI6MS4wfSwiYWRkX2JlZm9yZSI6eyJpZCI6bnVsbCwiYXR0ciI6MC4wfSwiYWRkX2FmdGVyIjp7ImlkIjpudWxsLCJhdHRyIjowLjB9fSx7InRhcmdldCI6eyJpZCI6InBsb3Q0IiwiYXR0ciI6ImhlaWdodCJ9LCJzb3VyY2UiOnsiaWQiOiJwbG90MyIsImF0dHIiOiJoZWlnaHQifSwibXVsdGlwbHkiOnsiaWQiOm51bGwsImF0dHIiOjEuMH0sImFkZF9iZWZvcmUiOnsiaWQiOm51bGwsImF0dHIiOjAuMH0sImFkZF9hZnRlciI6eyJpZCI6bnVsbCwiYXR0ciI6MC4wfX0seyJ0YXJnZXQiOnsiaWQiOiJwbG90NCIsImF0dHIiOiJ4In0sInNvdXJjZSI6eyJpZCI6InBsb3QzIiwiYXR0ciI6InJpZ2h0In0sIm11bHRpcGx5Ijp7ImlkIjpudWxsLCJhdHRyIjoxLjB9LCJhZGRfYmVmb3JlIjp7ImlkIjpudWxsLCJhdHRyIjowLjB9LCJhZGRfYWZ0ZXIiOnsiaWQiOiJoX3NwYWNpbmciLCJhdHRyIjpudWxsfX0seyJ0YXJnZXQiOnsiaWQiOiJwbG90NCIsImF0dHIiOiJ5In0sInNvdXJjZSI6eyJpZCI6InBsb3QzIiwiYXR0ciI6InkifSwibXVsdGlwbHkiOnsiaWQiOm51bGwsImF0dHIiOjEuMH0sImFkZF9iZWZvcmUiOnsiaWQiOm51bGwsImF0dHIiOjAuMH0sImFkZF9hZnRlciI6eyJpZCI6bnVsbCwiYXR0ciI6MC4wfX0seyJ0YXJnZXQiOnsiaWQiOiJwbG90NSIsImF0dHIiOiJ3aWR0aCJ9LCJzb3VyY2UiOnsiaWQiOiJwbG90MyIsImF0dHIiOiJ3aWR0aCJ9LCJtdWx0aXBseSI6eyJpZCI6bnVsbCwiYXR0ciI6MS4wfSwiYWRkX2JlZm9yZSI6eyJpZCI6bnVsbCwiYXR0ciI6MC4wfSwiYWRkX2FmdGVyIjp7ImlkIjpudWxsLCJhdHRyIjowLjB9fSx7InRhcmdldCI6eyJpZCI6InBsb3Q1IiwiYXR0ciI6ImhlaWdodCJ9LCJzb3VyY2UiOnsiaWQiOiJwbG90MyIsImF0dHIiOiJoZWlnaHQifSwibXVsdGlwbHkiOnsiaWQiOm51bGwsImF0dHIiOjEuMH0sImFkZF9iZWZvcmUiOnsiaWQiOm51bGwsImF0dHIiOjAuMH0sImFkZF9hZnRlciI6eyJpZCI6bnVsbCwiYXR0ciI6MC4wfX0seyJ0YXJnZXQiOnsiaWQiOiJwbG90NSIsImF0dHIiOiJ4In0sInNvdXJjZSI6eyJpZCI6InBsb3Q0IiwiYXR0ciI6InJpZ2h0In0sIm11bHRpcGx5Ijp7ImlkIjpudWxsLCJhdHRyIjoxLjB9LCJhZGRfYmVmb3JlIjp7ImlkIjpudWxsLCJhdHRyIjowLjB9LCJhZGRfYWZ0ZXIiOnsiaWQiOiJoX3NwYWNpbmciLCJhdHRyIjpudWxsfX0seyJ0YXJnZXQiOnsiaWQiOiJwbG90NSIsImF0dHIiOiJ5In0sInNvdXJjZSI6eyJpZCI6InBsb3QzIiwiYXR0ciI6InkifSwibXVsdGlwbHkiOnsiaWQiOm51bGwsImF0dHIiOjEuMH0sImFkZF9iZWZvcmUiOnsiaWQiOm51bGwsImF0dHIiOjAuMH0sImFkZF9hZnRlciI6eyJpZCI6bnVsbCwiYXR0ciI6MC4wfX1dLCJjb25zdGFudHMiOlt7ImlkIjoiaF9zcGFjaW5nIiwidmFsdWUiOjAuOH0seyJpZCI6InZfc3BhY2luZyIsInZhbHVlIjowLjV9LHsiaWQiOiJzcXVhcmVfcmF0aW8iLCJ2YWx1ZSI6MTAuMH1dLCJ2aWV3cG9ydCI6eyJmaWd1cmVXaWR0aCI6MTEsImZpZ3VyZUhlaWdodCI6OX19';

const COMMANDS: LayoutCommand[] = [
  {
    kind: 'setViewport',
    viewport: {
      width: 1400,
      height: 900,
      scale: 100,
      figureWidth: 11,
      figureHeight: 9,
    },
  },
  { kind: 'addElement', element: { id: 'plot1', type: 'axis', x: 0, y: 0, width: 1, height: 1, text: 'plot1' } },
  { kind: 'addElement', element: { id: 'plot2', type: 'axis', x: 0, y: 0, width: 1, height: 1, text: 'plot2' } },
  { kind: 'addElement', element: { id: 'plot3', type: 'axis', x: 0, y: 0, width: 1, height: 1, text: 'plot3' } },
  { kind: 'addElement', element: { id: 'plot4', type: 'axis', x: 0, y: 0, width: 1, height: 1, text: 'plot4' } },
  { kind: 'addElement', element: { id: 'plot5', type: 'axis', x: 0, y: 0, width: 1, height: 1, text: 'plot5' } },
  { kind: 'addConstant', constant: { id: 'h_spacing', value: 0.8 } },
  { kind: 'addConstant', constant: { id: 'v_spacing', value: 0.5 } },
  { kind: 'addConstant', constant: { id: 'square_ratio', value: 10 } },
  { kind: 'addConstraint', target: elementRef('plot1', 'x'), source: literal(0.7) },
  { kind: 'addConstraint', target: elementRef('plot1', 'y'), source: literal(0.5) },
  { kind: 'addConstraint', target: elementRef('plot1', 'width'), source: constantRef('square_ratio') },
  { kind: 'addConstraint', target: elementRef('plot1', 'height'), source: literal(1) },
  { kind: 'addConstraint', target: elementRef('plot2', 'x'), source: literal(0.7) },
  { kind: 'addConstraint', target: elementRef('plot2', 'width'), source: constantRef('square_ratio') },
  {
    kind: 'addConstraint',
    target: elementRef('plot2', 'y'),
    source: elementRef('plot1', 'top'),
    addAfter: constantRef('v_spacing'),
  },
  { kind: 'addConstraint', target: elementRef('plot2', 'height'), source: literal(3) },
  { kind: 'addConstraint', target: elementRef('plot3', 'width'), source: literal((10 - 2 * 0.8) / 3) },
  { kind: 'addConstraint', target: elementRef('plot3', 'height'), source: elementRef('plot3', 'width') },
  { kind: 'addConstraint', target: elementRef('plot3', 'x'), source: literal(0.7) },
  {
    kind: 'addConstraint',
    target: elementRef('plot3', 'y'),
    source: elementRef('plot2', 'top'),
    addAfter: constantRef('v_spacing'),
  },
  { kind: 'addConstraint', target: elementRef('plot4', 'width'), source: elementRef('plot3', 'width') },
  { kind: 'addConstraint', target: elementRef('plot4', 'height'), source: elementRef('plot3', 'height') },
  {
    kind: 'addConstraint',
    target: elementRef('plot4', 'x'),
    source: elementRef('plot3', 'right'),
    addAfter: constantRef('h_spacing'),
  },
  { kind: 'addConstraint', target: elementRef('plot4', 'y'), source: elementRef('plot3', 'y') },
  { kind: 'addConstraint', target: elementRef('plot5', 'width'), source: elementRef('plot3', 'width') },
  { kind: 'addConstraint', target: elementRef('plot5', 'height'), source: elementRef('plot3', 'height') },
  {
    kind: 'addConstraint',
    target: elementRef('plot5', 'x'),
    source: elementRef('plot4', 'right'),
    addAfter: constantRef('h_spacing'),
  },
  { kind: 'addConstraint', target: elementRef('plot5', 'y'), source: elementRef('plot3', 'y') },
];

function literal(value: number): LayoutValueRef {
  return { id: null, attr: value };
}

function constantRef(id: string): LayoutValueRef {
  return { id, attr: null };
}

function elementRef(id: string, attr: string): LayoutValueRef {
  return { id, attr };
}

function decodeLayout(serialized: string): LayoutPayload {
  const decoded = Buffer.from(serialized, 'base64').toString('utf8');
  return JSON.parse(decoded) as LayoutPayload;
}

function encodeLayout(payload: LayoutPayload): string {
  return Buffer.from(JSON.stringify(payload), 'utf8').toString('base64');
}

function toFixedNumber(value: number): number {
  return Number(value.toFixed(12));
}

function normalizeRef(ref: LayoutValueRef): { id: string | null; attr: string | number | null } {
  if (typeof ref.attr === 'number') {
    return { id: ref.id, attr: toFixedNumber(ref.attr) };
  }
  return { id: ref.id, attr: ref.attr };
}

function normalizeLayout(payload: LayoutPayload) {
  const elements = [...(payload.elements || [])]
    .map((element) => ({
      id: element.id,
      type: element.type,
      text: element.text ?? '',
      x: toFixedNumber(element.x),
      y: toFixedNumber(element.y),
      width: toFixedNumber(element.width),
      height: toFixedNumber(element.height),
    }))
    .sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)));

  const constants = [...(payload.constants || [])]
    .map((constant) => ({
      id: constant.id,
      value: toFixedNumber(constant.value),
    }))
    .sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)));

  const constraints = [...(payload.constraints || [])]
    .map((constraint) => ({
      target: normalizeRef(constraint.target),
      source: normalizeRef(constraint.source),
      multiply: normalizeRef(constraint.multiply),
      add_before: normalizeRef(constraint.add_before),
      add_after: normalizeRef(constraint.add_after),
    }))
    .sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)));

  const viewport = {
    figureWidth: payload.viewport?.figureWidth ?? null,
    figureHeight: payload.viewport?.figureHeight ?? null,
  };

  return { elements, constants, constraints, viewport };
}

function buildLayoutFromCommands(commands: LayoutCommand[]): LayoutPayload {
  const payload: LayoutPayload = {
    elements: [],
    constraints: [],
    constants: [],
    viewport: {
      width: 1400,
      height: 900,
      scale: 100,
      figureWidth: 7,
      figureHeight: 5,
    },
  };

  for (const command of commands) {
    if (command.kind === 'setViewport') {
      payload.viewport = { ...command.viewport };
      continue;
    }
    if (command.kind === 'addElement') {
      payload.elements.push({ ...command.element });
      continue;
    }
    if (command.kind === 'addConstant') {
      payload.constants.push({ ...command.constant });
      continue;
    }
    if (command.kind === 'addConstraint') {
      payload.constraints.push({
        target: { ...command.target },
        source: { ...(command.source ?? { id: null, attr: null }) },
        multiply: { ...(command.multiply ?? literal(1)) },
        add_before: { ...(command.addBefore ?? literal(0)) },
        add_after: { ...(command.addAfter ?? literal(0)) },
      });
    }
  }

  return payload;
}

async function solveLayoutViaApi(page: Parameters<typeof test>[0]['page'], payload: LayoutPayload): Promise<LayoutPayload> {
  const response = await page.request.post('/api/update_layout', { data: payload });
  expect(response.ok()).toBeTruthy();

  const solved = (await response.json()) as {
    elements: LayoutElement[];
    constraints: LayoutConstraint[];
    constants: LayoutConstant[];
    error?: unknown;
  };
  expect(solved.error).toBeUndefined();

  return {
    elements: solved.elements,
    constraints: solved.constraints,
    constants: solved.constants,
    viewport: payload.viewport,
  };
}

async function importLayout(page: Parameters<typeof test>[0]['page'], serialized: string): Promise<void> {
  await page.getByRole('button', { name: 'Import/Export' }).click();
  const modal = page.locator('.import-export-modal');
  await expect(modal).toBeVisible();
  await modal.locator('.import-export-textarea').fill(serialized);
  await modal.getByRole('button', { name: 'Import' }).click();
  await expect(modal).toHaveCount(0);
}

async function exportLayout(page: Parameters<typeof test>[0]['page']): Promise<string> {
  await page.getByRole('button', { name: 'Import/Export' }).click();
  const modal = page.locator('.import-export-modal');
  await expect(modal).toBeVisible();
  const serialized = await modal.locator('.import-export-textarea').inputValue();
  await modal.getByRole('button', { name: 'Close' }).click();
  await expect(modal).toHaveCount(0);
  return serialized;
}

test('command-built layout exports an equivalent layout to known baseline export', async ({ page }) => {
  await page.goto('/ui');

  await page.evaluate(() => {
    localStorage.clear();
    localStorage.setItem('autosave-enabled', 'false');
  });
  await page.reload();

  await page.getByRole('button', { name: 'Reset' }).click();
  await expect(page.locator('.draggable')).toHaveCount(0);

  const commandPayload = buildLayoutFromCommands(COMMANDS);
  const solvedPayload = await solveLayoutViaApi(page, commandPayload);
  const serializedFromCommands = encodeLayout(solvedPayload);

  await importLayout(page, serializedFromCommands);
  await expect(page.locator('.draggable')).toHaveCount(5);

  const exportedSerialized = await exportLayout(page);
  const expectedNormalized = normalizeLayout(decodeLayout(KNOWN_LAYOUT_FROM_PYTHON));
  const actualNormalized = normalizeLayout(decodeLayout(exportedSerialized));
  expect(actualNormalized).toEqual(expectedNormalized);

  await importLayout(page, exportedSerialized);
  const secondExport = await exportLayout(page);
  expect(normalizeLayout(decodeLayout(secondExport))).toEqual(expectedNormalized);
});
