import assert from 'node:assert/strict';
import test from 'node:test';
import { normalizeCliArgv } from '../src/cli/argv';

test('removes the literal pnpm separator before Commander parsing', () => {
  assert.deepEqual(
    normalizeCliArgv([
      'node',
      'dist/src/index.js',
      'monitor',
      '--',
      '--network',
      'mainnet',
      '--no-notify',
    ]),
    [
      'node',
      'dist/src/index.js',
      'monitor',
      '--network',
      'mainnet',
      '--no-notify',
    ]
  );
});

test('leaves ordinary argv untouched', () => {
  const argv = ['node', 'dist/src/index.js', 'monitor', '--network', 'both'];
  assert.deepEqual(normalizeCliArgv(argv), argv);
});

test('only removes the first standalone separator', () => {
  assert.deepEqual(
    normalizeCliArgv(['node', 'cli', 'monitor', '--', '--fail-on', '--']),
    ['node', 'cli', 'monitor', '--fail-on', '--']
  );
});
