'use strict';
/**
 * Shared base for the three DSpec hooks.
 *
 * ⚠️ **Hooks SUGGEST, they never BLOCK.** Every path through this file must end in `exit 0` —
 * including when the CLI is missing, the model has a syntax error, or the JSON is malformed.
 * A hook that blocks wrongly once is a hook that gets removed, and once removed nobody turns
 * it back on, so a removed defence is a defence worth zero.
 *
 * ⚠️ **Say nothing when there is nothing to say.** A line printed on every turn that carries
 * no information teaches the user to skim past the one label we need them to read.
 */
const { execFileSync } = require('node:child_process');
const path = require('node:path');
const fs = require('node:fs');

/** Read the hook payload from stdin. Malformed ⇒ empty object, never a throw. */
function readInput() {
  try { return JSON.parse(fs.readFileSync(0, 'utf-8') || '{}'); } catch { return {}; }
}

/** Repo root: the nearest ancestor directory containing `.ds/`. */
function findRepo(from) {
  let dir = path.resolve(from || process.cwd());
  for (;;) {
    if (fs.existsSync(path.join(dir, '.ds'))) return dir;
    const up = path.dirname(dir);
    if (up === dir) return null;
    dir = up;
  }
}

/**
 * Run the CLI inside the repo.
 *
 * The search order, and the order matters:
 *   0. **The copy shipped beside this hook.** When dspec is installed as a Claude Code plugin,
 *      `bin/ds.js` sits one directory up from `hooks/` and the user installed NOTHING else.
 *      This branch is why `/plugin install ds@ds` is the whole setup: no `npm i -g`, no npx,
 *      nothing on PATH. It is first because it is the only candidate guaranteed to be the same
 *      version as the hook asking for it.
 *   1. `cli` from `.ds/config.json` — the ABSOLUTE path of the very binary that ran
 *      `init`. ⚠️ Without this step, `npx ds init` leaves a repo with all three hooks
 *      wired and **no `ds` anywhere**: npx runs once and installs nothing onto PATH. All
 *      three hooks would then go permanently silent while the user believes they are running.
 *   2. `node_modules/.bin/ds` — a real install inside the repo.
 *   3. `ds` on PATH.
 *
 * **Never use `npx`** on any branch: it may go and download a package in the middle of a hook
 * that runs after every single file edit.
 */
/**
 * How the CLI was reached last time `ds()` ran — `null` until it has.
 *
 * ⚠️ Kept so the ADVICE can match the installation. `work` prints hints like
 * `→ ds compile`, which are correct for someone who installed the npm package and plain
 * wrong for someone who only installed the plugin: they have no `ds` on PATH, so the agent
 * reads the hint, runs it, and gets "command not found" from a tool that was working a second
 * ago. See `retarget`.
 */
let lastInvocation = null;

function ds(args, cwd, timeout = 5000) {
  let bin = null;
  // `__dirname` rather than `${CLAUDE_PLUGIN_ROOT}`: the variable is expanded into the hook
  // COMMAND, so it is not reliably in this process's environment, and a hook that reads an
  // empty string here would silently fall through to a `ds` that may not exist.
  const bundled = path.join(__dirname, '..', 'bin', 'ds.js');
  if (fs.existsSync(bundled)) bin = bundled;
  try {
    if (!bin) {
      const cfg = JSON.parse(fs.readFileSync(path.join(cwd, '.ds', 'config.json'), 'utf-8'));
      if (cfg && cfg.cli && fs.existsSync(cfg.cli)) bin = cfg.cli;
    }
  } catch { /* unreadable — try the next candidate */ }
  if (!bin) {
    const local = path.join(cwd, 'node_modules', '.bin', 'ds');
    bin = fs.existsSync(local) ? local : 'ds';
  }
  const cmd = bin.endsWith('.js') ? process.execPath : bin;
  const argv = bin.endsWith('.js') ? [bin, ...args] : args;
  // Only a bundled/absolute `.js` needs spelling out. A `ds` found on PATH is already what
  // the hints say, and rewriting it to an absolute path would make correct advice look strange.
  lastInvocation = bin === 'ds' ? null : (bin.endsWith('.js') ? `node "${bin}"` : bin);
  try {
    return execFileSync(cmd, argv, { cwd, timeout, encoding: 'utf-8', stdio: ['ignore', 'pipe', 'ignore'] });
  } catch (e) {
    // A non-zero exit can still carry valid stdout — `ds sync --strict` exits 1 when it FINDS something.
    return (e && e.stdout) || '';
  }
}

/**
 * Rewrite `ds <cmd>` in advice so it names the CLI this installation actually has.
 *
 * A no-op when `ds` is on PATH, which is the case this text was written for.
 *
 * ⚠️ **The verb list is read from the CLI that ships beside this file, never hand-kept here.**
 * The copy that used to live inline still named `compile` and `map` two command rewrites after
 * they were deleted. If the CLI cannot be loaded the answer is an empty list — the text then
 * passes through unrewritten, which is wrong but harmless, where rewriting a verb that no longer
 * exists tells the agent to run something that fails.
 */
function verbs() {
  try {
    return require(path.join(__dirname, '..', 'dist', 'cli', 'index.js')).VERBS || [];
  } catch {
    return [];
  }
}

function retarget(text) {
  if (!text || !lastInvocation) return text;
  const list = verbs();
  if (!list.length) return text;
  return text.replace(new RegExp(`\\bds (${list.join('|')})\\b`, 'g'), `${lastInvocation} $1`);
}

/** Context added to the session — read by the agent. */
function emitContext(eventName, text) {
  if (text) process.stdout.write(JSON.stringify({
    hookSpecificOutput: { hookEventName: eventName, additionalContext: retarget(text) },
  }));
  process.exit(0);
}

/** One line for a HUMAN to read in the terminal. */
function emitMessage(text) {
  if (text) process.stdout.write(JSON.stringify({ systemMessage: retarget(text) }));
  process.exit(0);
}

module.exports = { readInput, findRepo, ds, emitContext, emitMessage };
