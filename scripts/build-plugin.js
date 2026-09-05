#!/usr/bin/env node
'use strict';
// ============================================================
// Build the installable Claude Code plugin into `dist-plugin/`
//
// `plugin/` is the TEMPLATE source: it carries `__DS_CMD_*__` and `__DS_LANG_*__`
// placeholders, so it is not installable as-is — a `/plugin install` of it would hand the agent
// a SKILL.md instructing it to run `__DS_CMD_WORK__`. This script resolves those
// placeholders through the SAME functions `ds init` uses, so the plugin and an in-repo
// install can never say two different things.
//
// ⚠️ **The plugin is self-contained on purpose.** `bin/` and `dist/` are copied in beside the
// hooks, and every documented command runs that copy by absolute path. `/plugin install ds@ds`
// is then the entire setup: no `npm i -g`, no npx, nothing on PATH, and no version skew between
// the hook and the CLI it calls.
// ============================================================

const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
// Overridable so the test can build into a temp directory instead of the working tree.
const OUT = process.env.DSPEC_PLUGIN_OUT || path.join(ROOT, 'dist-plugin');

const { substituteCommands, substituteDocs, parseDoc, renderDoc } = require('../dist/install/render.js');

/** How a command is typed once installed as a plugin: `/ds:work`. */
const invoke = (name) => `/ds:${name}`;

/**
 * The CLI, addressed the one way that always resolves inside a plugin.
 *
 * A bare `ds` would need the user to have installed the npm package too — which is exactly
 * the second install this plugin exists to remove. `${CLAUDE_PLUGIN_ROOT}` is substituted by
 * Claude Code in command and skill content.
 */
const CLI = 'node "${CLAUDE_PLUGIN_ROOT}/bin/ds.js"';
const { VERBS } = require('../dist/cli/index.js');

/**
 * `ds sync` → `node "${CLAUDE_PLUGIN_ROOT}/bin/ds.js" sync`, in the body prose.
 *
 * ⚠️ **The verb list comes from the CLI, never from a copy written here.** A hand-kept list
 * outlived two rounds of command changes — `compile` and `map` were still being retargeted long
 * after the commands were deleted, and a verb the CLI no longer has is a verb this would happily
 * rewrite into a command that fails.
 */
const VERB_RE = new RegExp(`\\bds (${VERBS.join('|')})\\b`, 'g');

function retargetCli(text) {
  return text.replace(VERB_RE, `${CLI} $1`);
}

/**
 * `allowed-tools: Bash(ds map:*), Read` → `allowed-tools: Bash(node:*), Read`.
 *
 * ⚠️ The per-subcommand allowlist cannot survive: the command is now an interpolated absolute
 * path, and a permission entry that does not match what the command actually runs blocks it
 * SILENTLY — the user sees a command that does nothing and no reason why.
 */
function retargetTools(meta) {
  const tools = meta['allowed-tools'];
  if (typeof tools !== 'string') return meta;
  const rest = tools
    .split(',')
    .map((t) => t.trim())
    .filter((t) => t && !/^Bash\(ds /.test(t) && t !== 'Bash');
  return { ...meta, 'allowed-tools': ['Bash(node:*)', ...rest].join(', ') };
}

function copyTree(from, to) {
  fs.mkdirSync(to, { recursive: true });
  for (const e of fs.readdirSync(from, { withFileTypes: true })) {
    const s = path.join(from, e.name);
    const d = path.join(to, e.name);
    if (e.isDirectory()) copyTree(s, d);
    else fs.copyFileSync(s, d);
  }
}

function writeResolved(srcFile, destFile) {
  const raw = fs.readFileSync(srcFile, 'utf-8');
  const doc = parseDoc(raw, srcFile);
  const body = retargetCli(substituteDocs(substituteCommands(doc.body, invoke)));
  const meta = retargetTools(doc.meta);
  fs.mkdirSync(path.dirname(destFile), { recursive: true });
  fs.writeFileSync(destFile, renderDoc({ meta, body }), 'utf-8');
}

// ── one version, three files ────────────────────────────────────────────────
//
// ⚠️ `plugin.json.version` is what Claude Code compares to decide whether `/plugin update` has
// anything to do. `marketplace.json` advertises it, and `package.json` is what the repo calls
// itself. Three files carrying one number is three chances to disagree, and the failure is
// silent: users simply never receive the update. So the build refuses to run on a mismatch.
const readJson = (f) => JSON.parse(fs.readFileSync(path.join(ROOT, f), 'utf-8'));
const manifest = readJson('plugin/.claude-plugin/plugin.json');

// ⚠️ The plugin NAMES ITSELF, here and nowhere else. Repeating the name as a literal is how the
// last rename broke this script: `marketplace.json` had been renamed, the lookup had not, and
// the build died on a crash rather than a message anybody could act on.
const entry = readJson('.claude-plugin/marketplace.json').plugins.find((p) => p.name === manifest.name);
if (!entry) {
  console.error(`✗ marketplace.json lists no plugin called \`${manifest.name}\` — the install would 404`);
  process.exit(1);
}

const pkgVersion = readJson('package.json').version;
if (new Set([manifest.version, entry.version, pkgVersion]).size !== 1) {
  console.error(
    `✗ version mismatch — plugin.json ${manifest.version}, marketplace.json ${entry.version}, package.json ${pkgVersion}`,
  );
  process.exit(1);
}
const pluginVersion = manifest.version;

// ── build ───────────────────────────────────────────────────────────────────
fs.rmSync(OUT, { recursive: true, force: true });

copyTree(path.join(ROOT, 'plugin', '.claude-plugin'), path.join(OUT, '.claude-plugin'));
copyTree(path.join(ROOT, 'plugin', 'hooks'), path.join(OUT, 'hooks'));
copyTree(path.join(ROOT, 'bin'), path.join(OUT, 'bin'));
copyTree(path.join(ROOT, 'dist'), path.join(OUT, 'dist'));

for (const name of fs.readdirSync(path.join(ROOT, 'plugin', 'commands'))) {
  writeResolved(path.join(ROOT, 'plugin', 'commands', name), path.join(OUT, 'commands', name));
}
// The skill directory is named after the plugin — derived, not spelled out, for the reason in
// the version check above.
writeResolved(
  path.join(ROOT, 'plugin', 'skills', manifest.name, 'SKILL.md'),
  path.join(OUT, 'skills', manifest.name, 'SKILL.md'),
);

// ⚠️ A placeholder that survives here reaches the user as an instruction to run a command that
// does not exist. Fail the build rather than ship it.
const leaked = [];
(function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p);
    else if (/\.(md|json)$/.test(e.name) && /__DS_/.test(fs.readFileSync(p, 'utf-8'))) {
      leaked.push(path.relative(OUT, p));
    }
  }
})(OUT);
if (leaked.length) {
  console.error(`✗ unresolved placeholders in: ${leaked.join(', ')}`);
  process.exit(1);
}

console.log(`✓ ${manifest.name} ${pluginVersion} → ${path.relative(ROOT, OUT) || OUT}/ — ${fs.readdirSync(OUT).sort().join(', ')}`);
