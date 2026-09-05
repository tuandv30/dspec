// ============================================================
// Declaring the plugin in the project's own `.claude/settings.json`
//
// dspec is distributed as a Claude Code plugin and nothing else, which raises one question the
// old installer answered by copying files into the repo: **how does a teammate get it on clone?**
//
// The answer is `extraKnownMarketplaces` + `enabledPlugins`. Committed to the repo, they tell
// every teammate's Claude Code where dspec comes from and that this project uses it; once the
// folder is trusted, the marketplace is added and the plugin enabled with no further prompting.
// Copying commands and hooks into `.claude/` instead — which is what `init` used to do — creates
// a SECOND copy of files the plugin already provides: both fire, and the repo copy dies at the
// next `/plugin update`, because a plugin is cached under a path that carries its version.
//
// ⚠️ **MERGE, never overwrite, and on a parse failure WRITE NOTHING AT ALL.** `settings.json`
// belongs to the user. This is the same rule `install/hooks.ts` was built around, for the same
// reason: one stray comma must never cost somebody their whole configuration.
// ============================================================

import * as fs from 'node:fs';
import * as path from 'node:path';

/**
 * Where the marketplace is fetched from. The repo that holds `.claude-plugin/marketplace.json`.
 *
 * ⚠️ **`ref` is a RELEASE CHANNEL, not a version.** Without it Claude Code takes the repo's
 * default branch, so every teammate installed whatever happened to be on `master` at the minute
 * they cloned — including a commit pushed mid-refactor. `v1` is a tag that moves: it is force-moved
 * onto each release, the way `actions/checkout@v5` does, so "the latest release" is a name that
 * resolves rather than a number somebody has to look up.
 *
 * Claude Code has **no "latest tag" resolution** — `ref` must be a literal name — which is exactly
 * why the moving name has to exist. Anyone who wants to freeze writes the immutable `v1.0.0` in
 * their own settings instead; those tags are never moved.
 */
export const MARKETPLACE = { name: 'ds', repo: 'tuna781/dspec', ref: 'v1' } as const;

/** `<plugin>@<marketplace>` — how `enabledPlugins` addresses one plugin. */
export const PLUGIN_ID = `ds@${MARKETPLACE.name}`;

/**
 * Does this entry already point at our repo, whatever ref it names?
 *
 * The ref is the user's to choose — `v1` to follow releases, `v1.0.0` to stand still — so the only
 * question asked here is whether the entry is aimed at dspec at all.
 */
function pinnedHere(entry: unknown): boolean {
  if (entry === null || typeof entry !== 'object') return false;
  const source = (entry as { source?: unknown }).source;
  if (source === null || typeof source !== 'object') return false;
  return (source as { repo?: unknown }).repo === MARKETPLACE.repo;
}

export type ProjectOutcome =
  | { ok: true; path: string; changed: boolean }
  | { ok: false; reason: 'unreadable-settings'; path: string; detail: string };

interface Settings {
  extraKnownMarketplaces?: { [name: string]: unknown };
  enabledPlugins?: { [id: string]: boolean };
  [k: string]: unknown;
}

/**
 * Add the dspec marketplace and enable the plugin, keeping everything else in the file.
 *
 * Returns `changed: false` when the two keys already say what they should — so re-running `init`
 * reports honestly instead of claiming to have done work.
 */
export function declarePlugin(repo: string): ProjectOutcome {
  const file = path.join(repo, '.claude', 'settings.json');

  let raw: string | null = null;
  try {
    raw = fs.readFileSync(file, 'utf-8');
  } catch {
    /* absent is fine — this is the first install */
  }

  let settings: Settings = {};
  if (raw !== null && raw.trim()) {
    try {
      const parsed: unknown = JSON.parse(raw);
      if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
        return { ok: false, reason: 'unreadable-settings', path: file, detail: 'not a JSON object' };
      }
      settings = parsed as Settings;
    } catch (err) {
      return {
        ok: false,
        reason: 'unreadable-settings',
        path: file,
        detail: err instanceof Error ? err.message.split('\n')[0] : String(err),
      };
    }
  }

  const markets = { ...(settings.extraKnownMarketplaces ?? {}) };
  const plugins = { ...(settings.enabledPlugins ?? {}) };

  const wantMarket = { source: { source: 'github', repo: MARKETPLACE.repo, ref: MARKETPLACE.ref } };
  // ⚠️ **An existing entry for this repo keeps the ref it already has.** Writing `v1` over it would
  // drag anybody who deliberately pinned `v1.0.0` back onto the moving channel — silently, on a
  // command they ran for an unrelated reason. A pin is a decision, and the same rule that protects
  // an explicit `enabledPlugins: false` protects this. Only an absent entry, or one aimed at a
  // different repo, is ours to write.
  const marketSame = pinnedHere(markets[MARKETPLACE.name])
    || JSON.stringify(markets[MARKETPLACE.name]) === JSON.stringify(wantMarket);
  // ⚠️ Only ADD the plugin, never flip it back to `true`. A `false` here is somebody deliberately
  // turning dspec off in this project; re-enabling it behind their back on the next `init` is
  // the kind of thing that gets a tool uninstalled.
  const pluginKnown = Object.prototype.hasOwnProperty.call(plugins, PLUGIN_ID);

  if (marketSame && pluginKnown) return { ok: true, path: file, changed: false };

  if (!marketSame) markets[MARKETPLACE.name] = wantMarket;
  if (!pluginKnown) plugins[PLUGIN_ID] = true;

  const next: Settings = { ...settings, extraKnownMarketplaces: markets, enabledPlugins: plugins };
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(next, null, 2) + '\n', 'utf-8');
  return { ok: true, path: file, changed: true };
}

/**
 * What the project declares right now — read-only, for `doctor`.
 *
 * `ref` is read back rather than assumed, because the whole point is that the user may have chosen
 * a different one. `null` means the entry names no ref at all, which is Claude Code's default
 * branch — reported as such, never quietly rendered as `v1`.
 */
export function readDeclaration(repo: string): { marketplace: boolean; enabled: boolean | null; ref: string | null } {
  try {
    const s = JSON.parse(fs.readFileSync(path.join(repo, '.claude', 'settings.json'), 'utf-8')) as Settings;
    const enabled = s.enabledPlugins?.[PLUGIN_ID];
    const entry = s.extraKnownMarketplaces?.[MARKETPLACE.name];
    const source = entry && typeof entry === 'object' ? (entry as { source?: unknown }).source : undefined;
    const ref = source && typeof source === 'object' ? (source as { ref?: unknown }).ref : undefined;
    return {
      marketplace: Boolean(entry),
      enabled: enabled === undefined ? null : Boolean(enabled),
      ref: typeof ref === 'string' ? ref : null,
    };
  } catch {
    return { marketplace: false, enabled: null, ref: null };
  }
}
