'use strict';
// ============================================================
// What a user's repository actually receives.
//
// ⚠️ **`bootstrap` owns exactly two things: `.ds/`, and one key in the project's Claude Code settings.**
// Nothing else. The commands, the skill and the hooks all ship inside the plugin, so a hook can
// never be a different version from the CLI it calls — and there is nothing of ours for the user
// to keep in sync by hand.
// ============================================================
const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const { makeRepo, runCli, readIn, existsIn, writeIn } = require('../support/repo');

test('bootstrap seeds the four kinds and declares the plugin, and nothing else', () => {
  const dir = makeRepo({ files: { 'src/a.ts': 'export const a = 1;\n' } });
  assert.strictEqual(runCli(dir, 'bootstrap', '--here', '--yes').status, 0);

  assert.ok(existsIn(dir, '.ds/product.md'));
  assert.ok(existsIn(dir, '.ds/glossary.md'));
  assert.ok(existsIn(dir, '.ds/features'), 'the only directory anyone writes into');

  const settings = JSON.parse(readIn(dir, '.claude/settings.json'));
  assert.ok(settings.enabledPlugins['ds@ds'], 'a teammate who clones must get the loop without being told');

  // Nothing is copied into the user's own agent directories.
  for (const rel of ['.claude/commands', '.claude/skills', '.claude/hooks', '.claude/rules']) {
    assert.ok(!existsIn(dir, rel), `${rel} belongs to the user`);
  }
});

test('`.ds/` holds the four file kinds and nothing else', () => {
  // A fifth file explaining the language would be a second place to keep it documented, and the
  // second copy is the one that goes stale. The language is documented once, in the README, and
  // the scaffolded feature files carry their own guidance in frontmatter comments.
  const dir = makeRepo({ files: { 'src/a.ts': 'export const a = 1;\n' } });
  runCli(dir, 'bootstrap', '--here', '--yes');
  const fs = require('node:fs');
  const path = require('node:path');
  assert.deepStrictEqual(
    fs.readdirSync(path.join(dir, '.ds')).sort(),
    ['features', 'glossary.md', 'install.json', 'product.md'],
  );
});

test('an unreadable settings file is refused, never replaced', () => {
  const dir = makeRepo({ files: { 'src/a.ts': 'export const a = 1;\n', '.claude/settings.json': '{ this is not json' } });
  const r = runCli(dir, 'bootstrap', '--here', '--yes');
  assert.strictEqual(readIn(dir, '.claude/settings.json'), '{ this is not json', 'the user\'s file is theirs');
  assert.match(r.stdout + r.stderr, /settings\.json/);
});

test('an existing settings file is merged, not overwritten', () => {
  const dir = makeRepo({ files: {
    'src/a.ts': 'export const a = 1;\n',
    '.claude/settings.json': JSON.stringify({ env: { MINE: '1' } }, null, 2),
  } });
  runCli(dir, 'bootstrap', '--here', '--yes');
  const settings = JSON.parse(readIn(dir, '.claude/settings.json'));
  assert.strictEqual(settings.env.MINE, '1');
  assert.ok(settings.enabledPlugins['ds@ds']);
});

test('a plugin the user disabled stays disabled', () => {
  const dir = makeRepo({ files: {
    'src/a.ts': 'export const a = 1;\n',
    '.claude/settings.json': JSON.stringify({ enabledPlugins: { 'ds@ds': false } }, null, 2),
  } });
  runCli(dir, 'bootstrap', '--here', '--yes');
  assert.strictEqual(JSON.parse(readIn(dir, '.claude/settings.json')).enabledPlugins['ds@ds'], false,
    'they turned it off on purpose');
});

test('a second run touches nothing the user has edited', () => {
  const dir = makeRepo({ files: { 'src/a.ts': 'export const a = 1;\n' } });
  runCli(dir, 'bootstrap', '--here', '--yes');
  writeIn(dir, '.ds/product.md', '---\nname: Mine\n---\n\nMy own words.\n');
  runCli(dir, 'bootstrap', '--here', '--yes');
  assert.match(readIn(dir, '.ds/product.md'), /My own words/);
});

// ─── the release channel ────────────────────────────────────────────────────
//
// ⚠️ Users install from a REF, and which ref decides which code they run. Claude Code has no
// "latest tag" resolution — a ref is a literal name — so `v1` is a tag that moves onto each
// release. What these defend is that the default is that channel, and that a user who chose a
// different ref keeps it.

test('the declaration pins the release channel, not the default branch', () => {
  const dir = makeRepo({ files: { 'src/a.ts': 'export const a = 1;\n' } });
  runCli(dir, 'bootstrap', '--here', '--yes');

  const source = JSON.parse(readIn(dir, '.claude/settings.json')).extraKnownMarketplaces.ds.source;
  assert.strictEqual(source.repo, 'tuna781/dspec');
  assert.strictEqual(source.ref, 'v1', 'no ref means whatever landed on master an hour ago');
});

test('a ref the user chose is NEVER overwritten', () => {
  // Somebody who pinned v1.0.0 froze on purpose. Dragging them back onto the moving channel — on a
  // command they ran for an unrelated reason — is the same betrayal as flipping `enabled` back on.
  const dir = makeRepo({ files: { 'src/a.ts': 'export const a = 1;\n' } });
  writeIn(dir, '.claude/settings.json', JSON.stringify({
    extraKnownMarketplaces: { ds: { source: { source: 'github', repo: 'tuna781/dspec', ref: 'v1.0.0' } } },
    enabledPlugins: { 'ds@ds': true },
  }, null, 2));

  runCli(dir, 'bootstrap', '--here', '--yes');

  const source = JSON.parse(readIn(dir, '.claude/settings.json')).extraKnownMarketplaces.ds.source;
  assert.strictEqual(source.ref, 'v1.0.0', 'a pin is a decision, and it stands');
});

test('`ds version` reports which ref is installed', () => {
  // A frozen install nobody remembers freezing looks exactly like a broken update.
  const dir = makeRepo({ files: { 'src/a.ts': 'export const a = 1;\n' } });
  runCli(dir, 'bootstrap', '--here', '--yes');
  assert.match(runCli(dir, 'version').stdout, /tuna781\/dspec@v1/);
});
