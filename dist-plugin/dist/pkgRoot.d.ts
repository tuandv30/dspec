export declare function packageRoot(): string;
/**
 * The version this DSpec declares about itself.
 *
 * ⚠️ Returns `'unknown'`, never a plausible-looking `0.0.0`, when nothing declares one. A
 * version is written into the user's `install.json` as the record of what authored their model;
 * a made-up number there is worse than an admission, because it reads as an answer.
 */
export declare function packageVersion(): string;
