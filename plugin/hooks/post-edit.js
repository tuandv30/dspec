#!/usr/bin/env node
'use strict';
/**
 * Edit a file ⇒ print the features that claim it.
 *
 * Runs after EVERY file edit, so it stays local, fast, and silent when no feature points at the
 * file — which is the overwhelming majority of the time. That is the design: its value comes from
 * speaking rarely, so that when it does speak it is worth reading.
 *
 * ⚠️ **It reads the model in-process rather than shelling out.** There used to be a `ds whose`
 * verb that existed only for this hook — a command no user could name, answering a question no
 * command surface advertised. The lookup is three lines against the loader that ships beside this
 * file; a whole verb is not the right price for it, and a subprocess per keystroke was never free.
 */
const path = require('node:path');
const { readInput, findRepo, emitContext } = require('./_ds');

const input = readInput();
const repo = findRepo(input.cwd);
if (!repo) process.exit(0);

const file = input.tool_input && (input.tool_input.file_path || input.tool_input.notebook_path);
if (!file) process.exit(0);

const rel = file.startsWith(repo) ? file.slice(repo.length).replace(/^[/\\]/, '') : file;

let features = [];
try {
  const { loadModel } = require(path.join(__dirname, '..', 'dist', 'model', 'load.js'));
  const { featuresClaiming } = require(path.join(__dirname, '..', 'dist', 'compile', 'lint.js'));
  features = featuresClaiming(loadModel(repo).model, rel);
} catch {
  // A model that cannot be read is the ordinary case in a repo that has none. Say nothing: a hook
  // that reports its own failure after every edit is a hook people learn to ignore.
  process.exit(0);
}
if (!features.length) process.exit(0);

const lines = features.map((f) => {
  const bits = [`Feature: ${f.name}${f.area ? ` (${f.area})` : ''}`];
  if (f.entry) bits.push(`  start at: ${f.entry}`);
  if (f.uses.length) bits.push(`  uses: ${f.uses.join(', ')}`);
  return bits.join('\n');
});

emitContext('PostToolUse',
  `Features that claim this file:\n${lines.join('\n')}\n\n`
  + 'If what you just changed contradicts one of them, say so — do not leave the model '
  + 'describing behaviour the code no longer has.');
