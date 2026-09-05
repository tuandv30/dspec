/** Where the marketplace is fetched from. The repo that holds `.claude-plugin/marketplace.json`. */
export declare const MARKETPLACE: {
    readonly name: "ds";
    readonly repo: "tuna781/dspec";
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
/** What the project declares right now — read-only, for `doctor`. */
export declare function readDeclaration(repo: string): {
    marketplace: boolean;
    enabled: boolean | null;
};
