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
export declare const MARKETPLACE: {
    readonly name: "ds";
    readonly repo: "tuna781/dspec";
    readonly ref: "v1";
};
/** `<plugin>@<marketplace>` — how `enabledPlugins` addresses one plugin. */
export declare const PLUGIN_ID: string;
export type ProjectOutcome = {
    ok: true;
    path: string;
    changed: boolean;
} | {
    ok: false;
    reason: 'unreadable-settings';
    path: string;
    detail: string;
};
/**
 * Add the dspec marketplace and enable the plugin, keeping everything else in the file.
 *
 * Returns `changed: false` when the two keys already say what they should — so re-running `init`
 * reports honestly instead of claiming to have done work.
 */
export declare function declarePlugin(repo: string): ProjectOutcome;
/**
 * What the project declares right now — read-only, for `doctor`.
 *
 * `ref` is read back rather than assumed, because the whole point is that the user may have chosen
 * a different one. `null` means the entry names no ref at all, which is Claude Code's default
 * branch — reported as such, never quietly rendered as `v1`.
 */
export declare function readDeclaration(repo: string): {
    marketplace: boolean;
    enabled: boolean | null;
    ref: string | null;
};
