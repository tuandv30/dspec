import * as fs from 'node:fs';
import * as path from 'node:path';

/**
 * The root directory of the running DSpec — the repo checkout in development, the installed
 * plugin directory in the hands of a user.
 *
 * ⚠️ **Why not `path.join(__dirname, '..', '..', '..')`.** That chain of `..` encodes the
 * DEPTH of whichever file calls it inside `dist/` — three levels from `dist/cli/commands/`, two
 * from `dist/install/`. Every caller counting its own levels is another place that can be wrong
 * independently, and the mistake only surfaces after publishing.
 *
 * ⚠️ **Two identity files, because there are two layouts.** In this repo the root holds a
 * `package.json` named `ds`. The published plugin has no `package.json` at all — it is a plugin,
 * and it names itself in `.claude-plugin/plugin.json`. Looking only for the former is how
 * `ds version` came to report `v0.0.0` to every plugin user, and how `0.0.0` was then written
 * into their `.ds/install.json` as the version that had authored their model.
 *
 * The `name` guard on `package.json` is necessary: a repo that USES DSpec has a `package.json`
 * at its root too, and stopping at the first one found would return the user's project root.
 */
let cachedRoot: string | null = null;
let cachedVersion: string | null = null;

/**
 * Does `dir` identify itself as DSpec?
 *
 * `null` = not us. A string = us, carrying whatever version it declares (`''` when it declares
 * none — still a match, because the DIRECTORY is right even if the version is missing).
 */
function identify(dir: string): string | null {
  // The plugin layout first: it is the one users actually run.
  const files = [
    path.join(dir, '.claude-plugin', 'plugin.json'),
    path.join(dir, 'package.json'),
  ];
  for (const file of files) {
    try {
      const json = JSON.parse(fs.readFileSync(file, 'utf-8'));
      if (json.name === 'ds') return typeof json.version === 'string' ? json.version : '';
    } catch {
      /* absent, unreadable, or somebody else's — keep looking */
    }
  }
  return null;
}

function locate(): { root: string; version: string | null } {
  let dir = __dirname;
  for (;;) {
    const declared = identify(dir);
    if (declared !== null) return { root: dir, version: declared || null };
    const up = path.dirname(dir);
    if (up === dir) break;
    dir = up;
  }
  // Not found: fall back to the old guess rather than throwing. Callers already handle a
  // missing directory, and an exception here would kill the whole `init` command.
  return { root: path.resolve(__dirname, '..'), version: null };
}

export function packageRoot(): string {
  if (cachedRoot === null) {
    const found = locate();
    cachedRoot = found.root;
    cachedVersion = found.version;
  }
  return cachedRoot;
}

/**
 * The version this DSpec declares about itself.
 *
 * ⚠️ Returns `'unknown'`, never a plausible-looking `0.0.0`, when nothing declares one. A
 * version is written into the user's `install.json` as the record of what authored their model;
 * a made-up number there is worse than an admission, because it reads as an answer.
 */
export function packageVersion(): string {
  packageRoot();
  return cachedVersion || 'unknown';
}
