/** Run git and return its output, or `null` when it could not answer. Never throws. */
export declare function gitOut(repo: string, args: string[]): string | null;
export declare function isGitRepo(repo: string): boolean;
/**
 * Model files changed in the working tree — descriptions edited but not committed.
 *
 * ⚠️ **A model that has never been committed is NOT a pending change.** git reports an untracked
 * file exactly like a modified one, so a fresh scaffold — where every file is untracked — once
 * opened every session by announcing the whole model as outstanding work. Tracked-ness is the
 * test: once one model file is in git, a new untracked one beside it IS a real edit.
 *
 * ⚠️ **`-uall` is load-bearing.** By default git collapses an untracked directory to a single
 * entry, so twenty new feature files report as one change naming a directory that is not a file.
 */
export declare function changedModelFiles(repo: string, specDir: string): string[];
