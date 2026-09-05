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

/** Where the marketplace is fetched from. The repo that holds `.claude-plugin/marketplace.json`. */
export const MARKETPLACE = { name: 'ds', repo: 'tuna781/dspec' } as const;

/** `<plugin>@<marketplace>` — how `enabledPlugins` addresses one plugin. */
export const PLUGIN_ID = `ds@${MARKETPLACE.name}`;

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

  const wantMarket = { source: { source: 'github', repo: MARKETPLACE.repo } };
  const marketSame = JSON.stringify(markets[MARKETPLACE.name]) === JSON.stringify(wantMarket);
  // ⚠️ Only ADD the plugin, never flip it back to `true`. A `false` here is somebody deliberately
  // turning dspec off in this project; re-enabling it behind their back on the next `init` is
  // the kind of thing that gets a tool uninstalled.
  const pluginKnown = Object.prototype.hasOwnProperty.call(plugins, PLUGIN_ID);

  if (marketSame && pluginKnown) return { ok: true, path: file, changed: false };

  markets[MARKETPLACE.name] = wantMarket;
  if (!pluginKnown) plugins[PLUGIN_ID] = true;

  const next: Settings = { ...settings, extraKnownMarketplaces: markets, enabledPlugins: plugins };
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(next, null, 2) + '\n', 'utf-8');
  return { ok: true, path: file, changed: true };
}

/** What the project declares right now — read-only, for `doctor`. */
export function readDeclaration(repo: string): { marketplace: boolean; enabled: boolean | null } {
  try {
    const s = JSON.parse(fs.readFileSync(path.join(repo, '.claude', 'settings.json'), 'utf-8')) as Settings;
    const enabled = s.enabledPlugins?.[PLUGIN_ID];
    return {
      marketplace: Boolean(s.extraKnownMarketplaces?.[MARKETPLACE.name]),
      enabled: enabled === undefined ? null : Boolean(enabled),
    };
  } catch {
    return { marketplace: false, enabled: null };
  }
}
