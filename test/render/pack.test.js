'use strict';
// ============================================================
// Retrieval — a LOOKUP, not a search.
//
// ⚠️ **This file exists because of one measured failure.** Asked about "fingerprint the
// code and report drift", retrieval matched the word "Report" — a private helper in an unrelated
// file — returned that file as the code map, and told the agent everything else was unaffected.
// A false scope, asserted as authority. Every test below is a guard against that returning.
// ============================================================
const { test } = require('node:test');
const assert = require('node:assert');
const { renderPack, resolve, closure, suggest } = require('../../dist/compile/pack.js');
const { model, feature } = require('../fixtures/complete-model.js');
const { makeRepo } = require('../support/repo');

const REPO = makeRepo({ files: { 'src/order/place.ts': 'export const x = 1;\n' } });
const names = (fs) => fs.map((f) => f.name);

test('an exact name resolves', () => {
  assert.deepStrictEqual(names(resolve(model(), 'Place order').hits), ['Place order']);
});

test('a whole name inside a sentence resolves', () => {
  assert.deepStrictEqual(names(resolve(model(), 'I want to change how Place order works').hits), ['Place order']);
});

test('OVERLAPPING WORDS RESOLVE TO NOTHING — the failure this guards', () => {
  // "order" and "discount" both occur, and word overlap alone was once enough to seed a code map.
  const { hits } = resolve(model(), 'add an order-level discount report');
  assert.deepStrictEqual(hits, [], 'a confident wrong answer is worse than no answer');
});

test('a request naming nothing prints the index instead of a code map', () => {
  const out = renderPack(REPO, model(), 'add dark mode to the settings page');
  assert.match(out, /The model does not name this/);
  assert.match(out, /Every feature in the model/);
  assert.match(out, /- Place order/);
  assert.ok(!out.includes('## Code Map'), 'no scope may be asserted when nothing resolved');
});

test('the code map is the feature plus everything it uses, and nothing else', () => {
  const out = renderPack(REPO, model(), 'Place order');
  const map = out.slice(out.indexOf('## Code Map'), out.indexOf('## The feature'));
  assert.match(map, /src\/order\/place\.ts/);
  assert.match(map, /src\/billing\/discount\.ts/, 'a declared dependency cannot be silently missed');
});

test('the closure is depth 1 over declared edges', () => {
  const m = model();
  m.features.push(feature({ name: 'Far away', code: ['src/far.ts'], uses: [] }));
  m.features[1].uses = ['Far away'];
  const { used } = closure(m, [m.features[0]]);
  assert.deepStrictEqual(names(used), ['Apply discount'], 'depth 2 would pull the whole graph in');
});

test('--touch wins outright, and an unresolved seed is reported', () => {
  const out = renderPack(REPO, model(), 'anything at all', { touch: ['Apply discount', 'Nope'] });
  assert.match(out, /### Feature: Apply discount/);
  assert.match(out, /Seeds that did not resolve[\s\S]*Nope/);
});

test('a thin or unmeasured feature is flagged before the rules it qualifies', () => {
  const m = model({ features: [feature({ lead: '', body: '' })] });
  const out = renderPack(REPO, m, 'Place order');
  assert.match(out, /⚠ Unreliable in this task/);
  assert.match(out, /absence of a warning is not evidence/);
  assert.ok(out.indexOf('⚠ Unreliable') < out.indexOf('## Code Map'), 'a warning read after the content has failed');
});

// ─── the derived fallback ───────────────────────────────────────────────────
//
// ⚠️ Agent requests arrive as free text — a PR title, a failing command, a review comment — and
// almost never carry a feature's name. `suggest` exists so those land somewhere. What every test
// below defends is the LINE between it and `resolve`: a guess may be shown, and may never be
// asserted as scope.

test('a guess NEVER reaches the code map', () => {
  const out = renderPack(REPO, model(), 'change how the coupon total is worked out');
  assert.ok(!out.includes('## Code Map'), 'nothing resolved, so nothing may be asserted as scope');
  assert.match(out, /Possibly related — decide, do not assume/);
  assert.match(out, /A shared word is a coincidence/);
});

test('the resolver is unchanged — word overlap still resolves to nothing', () => {
  // The guarantee lives here, not in the renderer: `resolve` is what the code map is built from.
  assert.deepStrictEqual(resolve(model(), 'add an order-level discount report').hits, []);
});

test('a suggestion says WHICH words it matched, so it can be judged rather than trusted', () => {
  const [top] = suggest(model(), 'a coupon applied to an order');
  assert.strictEqual(top.feature.name, 'Apply discount');
  assert.ok(top.shared.includes('coupon'));
});

test('a name hit outweighs a body hit', () => {
  // Otherwise the most verbose feature wins whatever you ask, and the ranking is worthless.
  const m = model();
  m.features[1].name = 'Discount';
  const ranked = suggest(m, 'discount').map((s) => s.feature.name);
  assert.strictEqual(ranked[0], 'Discount');
});

test('`code:` paths are searchable, so a filename in the request lands', () => {
  const [top] = suggest(model(), 'something is wrong in discount.ts');
  assert.strictEqual(top.feature.name, 'Apply discount');
});

test('a request that shares nothing suggests nothing', () => {
  assert.deepStrictEqual(suggest(model(), 'zzzz qqqq'), []);
});

test('a resolved request gets no guesses at all', () => {
  // Suggestions are the no-match path. Printing them beside a real code map would blur exactly the
  // line this whole module is built on.
  const out = renderPack(REPO, model(), 'Place order');
  assert.match(out, /## Code Map/);
  assert.ok(!out.includes('Possibly related'), 'a guess must not sit beside an asserted scope');
});

test('the complete listing survives, below the guesses', () => {
  const out = renderPack(REPO, model(), 'change how the coupon total is worked out');
  const guesses = out.indexOf('Possibly related');
  const listing = out.indexOf('every feature in the model');
  assert.ok(guesses > 0 && listing > guesses, 'the ranking is a guess; the full list is the truth');
  assert.match(out, /- Place order/);
  assert.match(out, /Ask the user where this belongs/);
});

test('suggestions are deterministic', () => {
  // A listing that reorders between runs is one nobody can discuss.
  const a = suggest(model(), 'coupon order total').map((s) => s.feature.name);
  const b = suggest(model(), 'coupon order total').map((s) => s.feature.name);
  assert.deepStrictEqual(a, b);
});
