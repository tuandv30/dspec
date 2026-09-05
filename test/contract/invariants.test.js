'use strict';
// ============================================================
// The agent-facing surfaces.
//
// These files ARE the product: they are the only thing that turns a measurement into behaviour.
// Every rule here exists because a surface that drifts from the machine teaches an agent something
// the machine then penalises.
// ============================================================
const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const { ROOT } = require('../support/repo');

const COMMANDS = fs.readdirSync(path.join(ROOT, 'plugin/commands'));
const SURFACES = ['plugin/skills/ds/SKILL.md', ...COMMANDS.map((f) => `plugin/commands/${f}`)];
const read = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf-8');

test('placeholders are the only way a surface names another command', () => {
  // A hard-coded `/ds:sync` in a template is a second spelling that goes stale on its own, and the
  // build resolves the placeholder so an in-repo install and the published plugin cannot disagree.
  for (const rel of SURFACES) {
    const body = read(rel).split('---').slice(2).join('---');
    assert.deepStrictEqual(body.match(/\/ds:[a-z]+/g) ?? [], [], `${rel} hard-codes a command name`);
  }
});

test('no surface mentions a command the CLI does not have', () => {
  const { VERBS } = require('../../dist/cli/index.js');
  for (const rel of SURFACES) {
    for (const verb of read(rel).match(/\bds ([a-z]+)\b/g) ?? []) {
      const name = verb.slice(3);
      assert.ok(VERBS.includes(name), `${rel} calls \`${verb}\`, which is not a command`);
    }
  }
});

test('nothing keeps its own copy of the verb list', () => {
  // ⚠️ This is the test that was missing. Two hand-kept allow-lists — the plugin build's and the
  // hook helper's — went on retargeting `ds compile` and `ds map` for two rounds after those
  // commands were deleted. Rewriting a verb the CLI does not have tells the agent to run something
  // that fails, so both lists are now derived from `VERBS` and this fails if either is retyped.
  for (const rel of ['scripts/build-plugin.js', 'plugin/hooks/_ds.js']) {
    const body = read(rel);
    assert.ok(/VERBS/.test(body), `${rel} does not read the verb set from the CLI`);
    const inline = body.match(/\\bds \(([a-z|]+)\)\\b/);
    assert.strictEqual(inline, null, `${rel} hard-codes a verb list: ${inline && inline[1]}`);
  }
});

test('every slash command the skill names exists as a file', () => {
  const skill = read('plugin/skills/ds/SKILL.md');
  for (const ph of skill.match(/__DS_CMD_([A-Z]+)__/g) ?? []) {
    const name = ph.replace(/__DS_CMD_|__/g, '').toLowerCase();
    assert.ok(COMMANDS.includes(`${name}.md`), `the skill names /ds:${name}, which has no command file`);
  }
});

test('`/ds:spec` ships with no way to write', () => {
  // It is the one command that must be unable to leave the model describing something that does
  // not exist yet, and a tool list is the only instruction here that is actually enforced.
  const meta = read('plugin/commands/spec.md').split('---')[1];
  assert.ok(!/\b(Write|Edit)\b/.test(meta), 'spec.md must not grant a write tool');
});

test('every command declares a tool list', () => {
  for (const rel of COMMANDS.map((f) => `plugin/commands/${f}`)) {
    assert.match(read(rel), /allowed-tools:/, `${rel} has no fence`);
  }
});

test('the hooks only ever add context, and always exit 0', () => {
  const hooks = fs.readdirSync(path.join(ROOT, 'plugin/hooks')).filter((f) => f.endsWith('.js'));
  for (const f of hooks) {
    const body = read(`plugin/hooks/${f}`);
    assert.ok(!/process\.exit\([1-9]/.test(body), `${f} can fail a tool call`);
    assert.ok(!/"decision"|permissionDecision|"deny"/.test(body), `${f} tries to block`);
  }
});

test('the stop hook only offers sync for what sync can actually fix', () => {
  const { FIXED_BY_SYNC } = require('../../dist/code/staleness.js');
  const body = read('plugin/hooks/stop.js');
  for (const kind of FIXED_BY_SYNC) {
    assert.ok(body.includes(`'${kind}'`), `stop.js does not offer sync for \`${kind}\``);
  }
  const { STALE_LABEL } = require('../../dist/code/staleness.js');
  for (const kind of Object.keys(STALE_LABEL)) {
    if (FIXED_BY_SYNC.has(kind)) continue;
    assert.ok(!body.includes(`'${kind}'`), `stop.js offers sync for \`${kind}\`, which sync cannot resolve`);
  }
});
