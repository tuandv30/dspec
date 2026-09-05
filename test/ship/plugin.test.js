'use strict';
// ============================================================
// What actually ships, and whether it can run on its own.
//
// ⚠️ **`/plugin install ds@ds` is the ENTIRE setup.** No `npm i -g`, no npx, nothing of ours on
// anybody's PATH. So the plugin has to carry its own CLI, and every documented command has to
// address that copy by absolute path — a plugin-only user has no `ds` anywhere, and a command
// telling them to run one fails on first use.
//
// ⚠️ **`dist-plugin/` is committed**, so it can fall behind `plugin/` silently: the templates get
// edited, every test stays green, and the thing users install is the old one.
// ============================================================
const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { ROOT, makeRepo, runCli } = require('../support/repo.js');

/** Build the plugin into a temp directory, so the test never depends on what is committed. */
const OUT = fs.mkdtempSync(path.join(os.tmpdir(), 'dspec-plugin-'));
execFileSync(process.execPath, [path.join(ROOT, 'scripts', 'build-plugin.js')],
  { env: { ...process.env, DSPEC_PLUGIN_OUT: OUT }, stdio: ['ignore', 'pipe', 'pipe'] });
process.on('exit', () => { try { fs.rmSync(OUT, { recursive: true, force: true }); } catch { /* best effort */ } });

const has = (rel) => fs.existsSync(path.join(OUT, ...rel.split('/')));
const read = (rel) => fs.readFileSync(path.join(OUT, ...rel.split('/')), 'utf-8');
// ⚠️ Read from the template directory, never typed here. A hand-kept copy of the command list is
// how `check` and `doctor` went on being asserted for after they were deleted — the same drift
// that let `compile` and `map` survive in two retarget lists.
const SURFACE = fs.readdirSync(path.join(ROOT, 'plugin', 'commands')).map((f) => path.basename(f, '.md'));

test('the plugin ships the CLI it tells people to run', () => {
  assert.ok(has('bin/ds.js'), 'no bundled CLI');
  assert.ok(has('dist/cli/index.js'), 'no compiled sources');
  assert.ok(has('.claude-plugin/plugin.json'));
  assert.ok(has('skills/ds/SKILL.md'));
  assert.ok(has('hooks/hooks.json'));
  for (const c of SURFACE) assert.ok(has(`commands/${c}.md`), `commands/${c}.md missing`);
});

test('the bundled CLI runs, and installs a repo on its own', () => {
  const target = fs.mkdtempSync(path.join(os.tmpdir(), 'dspec-target-'));
  try {
    execFileSync(process.execPath, [path.join(OUT, 'bin', 'ds.js'), 'bootstrap', target, '--yes', '--no-git'],
      { stdio: ['ignore', 'pipe', 'pipe'] });
    assert.ok(fs.existsSync(path.join(target, '.ds', 'product.md')));
  } finally {
    fs.rmSync(target, { recursive: true, force: true });
  }
});

test('no `__DS_` placeholder survives into anything installed', () => {
  // `plugin/` is a template. A leaked token reaches the agent verbatim — a SKILL.md instructing
  // it to run `__DS_CMD_SYNC__`.
  const leaked = [];
  (function walk(d) {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) walk(p);
      else if (/\.(md|json)$/.test(e.name) && /__DS_/.test(fs.readFileSync(p, 'utf-8'))) {
        leaked.push(path.relative(OUT, p));
      }
    }
  })(OUT);
  assert.deepStrictEqual(leaked, []);
});

test('every documented command addresses the bundled CLI, not a bare `ds`', () => {
  // ⚠️ The verb list comes from the CLI, not from a copy typed here — a third hand-kept list was
  // still asserting against `compile` and `map` long after those commands were deleted.
  const { VERBS } = require('../../dist/cli/index.js');
  const bare = new RegExp(`(^|[^/"])\\bds (${VERBS.join('|')})\\b`, 'm');
  for (const c of SURFACE) {
    const body = read(`commands/${c}.md`);
    // A command that runs nothing is legitimate — `/ds:plan` delegates to `/ds:spec` rather than
    // re-running the CLI itself. What must never happen is a bare `ds` surviving the build, since
    // nothing puts dspec on the user's PATH.
    if (!/\bds [a-z]+/.test(body)) continue;
    assert.match(body, /\$\{CLAUDE_PLUGIN_ROOT\}\/bin\/ds\.js/, `${c}.md names a verb but never the bundled CLI`);
    assert.ok(!bare.test(body), `${c}.md still calls a bare ds`);
  }
});

test('the per-subcommand allowlist is stripped — it cannot match the real command', () => {
  // ⚠️ `Bash(ds map:*)` cannot match `node "…/ds.js" map`, and a permission entry that does not
  // match blocks the command SILENTLY: the user sees a command that does nothing and no reason
  // why. This is also why `/ds:spec`'s guarantee has to be the TOOL LIST rather than a
  // subcommand restriction — that restriction does not survive this step.
  for (const c of SURFACE) {
    const body = read(`commands/${c}.md`);
    assert.ok(!/Bash\(ds /.test(body), `${c}.md kept a per-subcommand allowlist`);
  }
  assert.match(read('commands/sync.md'), /allowed-tools:.*Bash\(node:\*\)/);
});

test('`/ds:spec` still cannot write once built — the invariant survives the template step', () => {
  const tools = read('commands/spec.md').split('\n').find((l) => l.startsWith('allowed-tools:')) || '';
  for (const forbidden of ['Write', 'Edit', 'MultiEdit']) {
    assert.ok(!new RegExp(`\\b${forbidden}\\b`).test(tools), `built spec.md can ${forbidden}: ${tools}`);
  }
});

test('the committed `dist-plugin/` is what the templates produce', () => {
  // ⚠️ It is committed, so it goes stale in silence: templates get edited, the suite stays green,
  // and what people install is last week's copy.
  const committed = path.join(ROOT, 'dist-plugin');
  const differing = [];
  (function walk(rel) {
    for (const e of fs.readdirSync(path.join(OUT, rel || '.'), { withFileTypes: true })) {
      const r = rel ? `${rel}/${e.name}` : e.name;
      if (e.isDirectory()) { walk(r); continue; }
      if (r.endsWith('.map')) continue;
      const a = path.join(OUT, ...r.split('/'));
      const b = path.join(committed, ...r.split('/'));
      if (!fs.existsSync(b) || !fs.readFileSync(a).equals(fs.readFileSync(b))) differing.push(r);
    }
  })('');
  assert.deepStrictEqual(differing, [], 'run `npm run build:plugin` and commit the result');
});

test('the hook helper prefers the copy shipped beside it', () => {
  // Branch 0 of the search order, and the reason `/plugin install` is the whole setup: it is the
  // only candidate guaranteed to be the same version as the hook asking for it.
  assert.match(read('hooks/_ds.js'), /__dirname,\s*'\.\.',\s*'bin',\s*'ds\.js'/);
});

test('a hook NEVER invokes npx', () => {
  // `post-edit` runs after every single file edit, and npx may go and download a package in the
  // middle of one. Comments are stripped before looking: `_ds.js` documents the rule at length,
  // and a test that cannot tell a warning from a call is one that gets silenced rather than fixed.
  const stripComments = (src) => src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
  for (const h of ['_ds.js', 'session-start.js', 'post-edit.js', 'stop.js']) {
    assert.ok(!/\bnpx\b/.test(stripComments(read(`hooks/${h}`))), `${h} invokes npx`);
  }
});

test('all three hooks are registered, and none of them can block', () => {
  const hooks = JSON.parse(read('hooks/hooks.json')).hooks;
  assert.deepStrictEqual(Object.keys(hooks).sort(), ['PostToolUse', 'SessionStart', 'Stop']);
  for (const h of ['session-start.js', 'post-edit.js', 'stop.js']) {
    // Every path out of a hook is `exit 0`. A hook that blocks wrongly once gets removed, and a
    // removed defence is worth nothing.
    assert.ok(!/process\.exit\([^0]/.test(read(`hooks/${h}`)), `${h} can exit non-zero`);
  }
});

test('`version` reports and never blocks, whatever it finds', () => {
  const bare = makeRepo({ model: true, git: 'none' });
  const r = runCli(bare, 'version');
  assert.strictEqual(r.status, 0, r.stderr);
  assert.match(r.stdout, /node/);
  assert.match(r.stdout, /model/);
  // It flags an undeclared plugin — that is the point of running it — without failing.
  assert.match(r.stdout, /plugin/);
});
