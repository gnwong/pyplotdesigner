import { expect, test } from '@playwright/test';
import { ACTION_SEQUENCE_SCENARIOS } from './action_sequences.fixtures';
import { runActionScenario } from './action_sequence_runner';

test.describe.configure({ retries: 1 });

for (const scenario of ACTION_SEQUENCE_SCENARIOS) {
  test(`action sequence export: ${scenario.name}`, async ({ page }) => {
    const exported = await runActionScenario(page, scenario);

    if (process.env.PRINT_ACTION_SEQUENCE_EXPORTS === '1') {
      // Temporary capture mode for bootstrapping new exact fixtures.
      console.log(`ACTION_SEQUENCE_EXPORT ${scenario.name} ${exported}`);
    }

    expect(exported).toBe(scenario.expectedExport);
  });
}
