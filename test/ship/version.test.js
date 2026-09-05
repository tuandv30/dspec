'use strict';
// ============================================================
// `ds version` — what is installed, and can it run.
//
// ⚠️ It is a DIAGNOSTIC, not a gate: it always exits 0, whatever it finds. And it reports only
// what is installed — never what is latest, because that needs a network call dspec does not make.
// ============================================================
const { test } = require('node:test');
const assert = require('node:assert');
const { makeRepo, runCli } = require('../support/repo');

const repo = () => makeRepo({ files: {
  'src/a.ts': 'export const a = 1;\n',
  '.ds/product.md': '---\nname: Calc\n---\n\nA calculator.\n',
  '.ds/features/a.md': '---\nname: A\narea: X\ncode: [src/a.ts]\n---\n\nBody.\n',
} });

test('the version leads, because it is the question being asked', () => {
  const r = runCli(repo(), 'version');
  assert.strictEqual(r.status, 0);
  const firstLine = r.stdout.split('\n').filter(Boolean)[0];
  assert.match(firstLine, /^dspec \d+\.\d+\.\d+/, `headline was: ${firstLine}`);
});

test('it names WHERE it is installed, not only the number', () => {
  // A plugin is cached under a directory carrying its version, so the path is what tells a bug
  // report whether the installed plugin answered or a checkout somebody is hacking on.
  assert.match(runCli(repo(), 'version').stdout, /installed at\s+\//);
});

test('it never claims to know the latest version', () => {
  const out = runCli(repo(), 'version').stdout;
  assert.ok(!/latest|newest|up to date|out of date/i.test(out.replace(/\/ds:update/g, '')),
    'knowing the latest needs a network call, and dspec makes none');
});

test('it always exits 0, whatever it finds', () => {
  const broken = makeRepo({ files: { 'src/a.ts': 'export const a = 1;\n' } });
  assert.strictEqual(runCli(broken, 'version').status, 0, 'a diagnostic is not a gate');
});

test('a missing model is named as such, with the command that fixes it', () => {
  const out = runCli(makeRepo({ files: { 'src/a.ts': 'export const a = 1;\n' } }), 'version').stdout;
  assert.match(out, /model/);
  assert.match(out, /ds bootstrap/, 'say which half is wrong and what to type');
});

test('--json carries the version as data, not only as prose', () => {
  const parsed = JSON.parse(runCli(repo(), 'version', '--json').stdout);
  assert.match(parsed.version, /^\d+\.\d+\.\d+/);
  assert.ok(parsed.root && parsed.findings.length);
});
