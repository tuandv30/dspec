/** Is this path one the model is expected to account for? Exactly one place decides. */
export declare function isSourceFile(rel: string): boolean;
/**
 * Every source file git tracks.
 *
 * ⚠️ Returns `[]` rather than throwing when this is not a git checkout. Coverage then reports
 * nothing, which is the honest answer — "I cannot see your files" must not render as "every file
 * is described".
 */
export declare function trackedSources(repo: string): string[];
