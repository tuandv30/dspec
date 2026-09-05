"use strict";
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
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.PLUGIN_ID = exports.MARKETPLACE = void 0;
exports.declarePlugin = declarePlugin;
exports.readDeclaration = readDeclaration;
const fs = __importStar(require("node:fs"));
const path = __importStar(require("node:path"));
/** Where the marketplace is fetched from. The repo that holds `.claude-plugin/marketplace.json`. */
exports.MARKETPLACE = { name: 'ds', repo: 'tuna781/dspec' };
/** `<plugin>@<marketplace>` — how `enabledPlugins` addresses one plugin. */
exports.PLUGIN_ID = `ds@${exports.MARKETPLACE.name}`;
/**
 * Add the dspec marketplace and enable the plugin, keeping everything else in the file.
 *
 * Returns `changed: false` when the two keys already say what they should — so re-running `init`
 * reports honestly instead of claiming to have done work.
 */
function declarePlugin(repo) {
    const file = path.join(repo, '.claude', 'settings.json');
    let raw = null;
    try {
        raw = fs.readFileSync(file, 'utf-8');
    }
    catch {
        /* absent is fine — this is the first install */
    }
    let settings = {};
    if (raw !== null && raw.trim()) {
        try {
            const parsed = JSON.parse(raw);
            if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
                return { ok: false, reason: 'unreadable-settings', path: file, detail: 'not a JSON object' };
            }
            settings = parsed;
        }
        catch (err) {
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
    const wantMarket = { source: { source: 'github', repo: exports.MARKETPLACE.repo } };
    const marketSame = JSON.stringify(markets[exports.MARKETPLACE.name]) === JSON.stringify(wantMarket);
    // ⚠️ Only ADD the plugin, never flip it back to `true`. A `false` here is somebody deliberately
    // turning dspec off in this project; re-enabling it behind their back on the next `init` is
    // the kind of thing that gets a tool uninstalled.
    const pluginKnown = Object.prototype.hasOwnProperty.call(plugins, exports.PLUGIN_ID);
    if (marketSame && pluginKnown)
        return { ok: true, path: file, changed: false };
    markets[exports.MARKETPLACE.name] = wantMarket;
    if (!pluginKnown)
        plugins[exports.PLUGIN_ID] = true;
    const next = { ...settings, extraKnownMarketplaces: markets, enabledPlugins: plugins };
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, JSON.stringify(next, null, 2) + '\n', 'utf-8');
    return { ok: true, path: file, changed: true };
}
/** What the project declares right now — read-only, for `doctor`. */
function readDeclaration(repo) {
    try {
        const s = JSON.parse(fs.readFileSync(path.join(repo, '.claude', 'settings.json'), 'utf-8'));
        const enabled = s.enabledPlugins?.[exports.PLUGIN_ID];
        return {
            marketplace: Boolean(s.extraKnownMarketplaces?.[exports.MARKETPLACE.name]),
            enabled: enabled === undefined ? null : Boolean(enabled),
        };
    }
    catch {
        return { marketplace: false, enabled: null };
    }
}
//# sourceMappingURL=project.js.map