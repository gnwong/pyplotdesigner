import { expect, test } from '@playwright/test';
import { ACTION_SEQUENCE_SCENARIOS } from './action_sequences.fixtures';
import { runActionScenario } from './action_sequence_runner';
import { decodeLayoutString } from './layout_serialization';

test.describe.configure({ retries: 1 });

const DEFAULT_SCENARIO_NAMES = ['custom_complex_layout_only_base64_check'];

function getScenariosToRun() {
  const requested = process.env.ACTION_SCENARIOS?.trim();
  if (!requested) {
    return ACTION_SEQUENCE_SCENARIOS.filter((scenario) => DEFAULT_SCENARIO_NAMES.includes(scenario.name));
  }
  if (requested.toLowerCase() === 'all') {
    return ACTION_SEQUENCE_SCENARIOS;
  }

  const requestedNames = new Set(
    requested
      .split(',')
      .map((name) => name.trim())
      .filter(Boolean)
  );
  return ACTION_SEQUENCE_SCENARIOS.filter((scenario) => requestedNames.has(scenario.name));
}

const SCENARIOS_TO_RUN = getScenariosToRun();

if (SCENARIOS_TO_RUN.length === 0) {
  throw new Error(
    'No action sequence scenarios selected. Set ACTION_SCENARIOS=all or provide a comma-separated list of scenario names.'
  );
}

for (const scenario of SCENARIOS_TO_RUN) {
  test(`action sequence export: ${scenario.name}`, async ({ page }) => {
    const exported = await runActionScenario(page, scenario);

    if (process.env.PRINT_ACTION_SEQUENCE_EXPORTS === '1') {
      // Keep captured fixtures in the legacy format for compatibility coverage.
      const legacy = Buffer.from(JSON.stringify(decodeLayoutString(exported)), 'utf8').toString('base64');
      console.log(`ACTION_SEQUENCE_EXPORT ${scenario.name} ${legacy}`);
    }

    expect(exported).toMatch(/^ppd1:/);
    expect(decodeLayoutString(exported)).toEqual(decodeLayoutString(scenario.expectedExport));
  });
}
