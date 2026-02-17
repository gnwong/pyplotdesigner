#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const repoRoot = process.cwd();
const fixturePath = path.join(repoRoot, 'tests/e2e/action_sequences.fixtures.ts');
const specPath = 'tests/e2e/export_action_sequences.spec.ts';
const condaPrefix = ['conda', 'run', '-n', 'test_env', 'npx', 'playwright', 'test'];

function runPlaywright({ captureMode }) {
  const args = [...condaPrefix, specPath];
  const env = { ...process.env };
  if (!env.PYLOTPD_E2E_PORT) {
    env.PYLOTPD_E2E_PORT = '10821';
  }
  if (captureMode) {
    env.PRINT_ACTION_SEQUENCE_EXPORTS = '1';
  }
  const result = spawnSync(args[0], args.slice(1), {
    cwd: repoRoot,
    env,
    encoding: 'utf8',
    stdio: 'pipe',
  });

  const output = `${result.stdout || ''}${result.stderr || ''}`;
  process.stdout.write(output);
  return { code: result.status ?? 1, output };
}

function parseCapturedExports(output) {
  const regex = /^ACTION_SEQUENCE_EXPORT\s+([^\s]+)\s+([A-Za-z0-9+/=]+)$/gm;
  const captures = new Map();
  let match = regex.exec(output);
  while (match) {
    const [, name, serialized] = match;
    captures.set(name, serialized);
    match = regex.exec(output);
  }
  return captures;
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function updateFixtureFile(captures) {
  let text = fs.readFileSync(fixturePath, 'utf8');
  let updatedCount = 0;

  for (const [name, serialized] of captures.entries()) {
    const pattern = new RegExp(
      `(name:\\s*'${escapeRegExp(name)}'[\\s\\S]*?expectedExport:\\s*')([^']*)(')`,
      'm'
    );
    if (!pattern.test(text)) {
      console.warn(`Skipping unknown scenario "${name}" (not found in fixture file).`);
      continue;
    }
    text = text.replace(pattern, `$1${serialized}$3`);
    updatedCount += 1;
  }

  if (updatedCount === 0) {
    throw new Error('No fixture entries were updated.');
  }

  fs.writeFileSync(fixturePath, text, 'utf8');
  console.log(`Updated ${updatedCount} scenario export fixture(s) in ${fixturePath}`);
}

function main() {
  console.log('Capturing action-sequence exports from Playwright...');
  const capture = runPlaywright({ captureMode: true });
  const captures = parseCapturedExports(capture.output);
  if (captures.size === 0) {
    throw new Error('No ACTION_SEQUENCE_EXPORT lines found. Capture failed.');
  }

  updateFixtureFile(captures);

  console.log('\nRunning strict verification after fixture update...');
  const verify = runPlaywright({ captureMode: false });
  if (verify.code !== 0) {
    throw new Error('Verification run failed after updating fixtures.');
  }
  console.log('\nAction-sequence export fixtures are up to date.');
}

main();
