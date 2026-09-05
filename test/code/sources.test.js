'use strict';
// ============================================================
// What counts as this product's source — the denominator of coverage.
//
// Every rule here exists because a report full of things the user never wrote is a report the user
// stops reading. Each exclusion was a real line in a real coverage report.
// ============================================================
const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const { isSourceFile, trackedSources } = require('../../dist/code/sources.js');
const { makeRepo } = require('../support/repo');

test('code counts, prose and config do not', () => {
  assert.ok(isSourceFile('src/a.ts'));
  assert.ok(isSourceFile('lib/a.py'));
  assert.ok(!isSourceFile('README.md'));
  assert.ok(!isSourceFile('package.json'));
});

test('build output is excluded, suffix and all', () => {
  assert.ok(!isSourceFile('dist/a.js'));
  assert.ok(!isSourceFile('dist-plugin/hooks/stop.js'), 'a build output does not stop being one for having a suffix');
  assert.ok(!isSourceFile('build/x/a.js'));
});

test('tests are excluded by filename AND by directory', () => {
  assert.ok(!isSourceFile('src/a.test.ts'));
  assert.ok(!isSourceFile('pkg/a_test.go'));
  assert.ok(!isSourceFile('test/support/repo.js'), 'a helper is test material even without a test-shaped name');
  assert.ok(!isSourceFile('test/fixtures/model.js'));
});

test('a file git tracks but that is gone is not source', () => {
  const dir = makeRepo({ files: { 'src/a.ts': 'export const a = 1;\n', 'src/b.ts': 'export const b = 2;\n' }, git: 'committed' });
  fs.rmSync(path.join(dir, 'src/b.ts'));
  assert.deepStrictEqual(trackedSources(dir), ['src/a.ts'], 'asking about a file the user just deleted is noise');
});

test('outside a git checkout the answer is empty, not an error', () => {
  const dir = makeRepo({ files: { 'src/a.ts': 'export const a = 1;\n' }, git: 'none' });
  assert.deepStrictEqual(trackedSources(dir), []);
});
