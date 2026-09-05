/**
 * `1 file` · `3 files` · `2 entities`.
 *
 * Written out rather than left as `file(s)` because compile output is read by agents and CLI
 * output is the first thing a user sees — and `entity(ies)` is not a word. English only: the CLI
 * has no locale, and the vocabulary an agent parses is English by definition (`model/language.ts`).
 */
export declare function plural(n: number, one: string, many?: string): string;
/**
 * `src/code/hash.ts` → `Hash` · `place_order` → `Place order`.
 *
 * Used when proposing a name from a path. It deliberately does not try to guess mid-sentence
 * capitalisation: guessing one capital wrong produces two labels for one feature, and `uses:`
 * would resolve against neither.
 */
export declare function humanise(token: string): string;
/**
 * `Drift detection` → `drift-detection`.
 *
 * ⚠️ Must stay the inverse of the loader's filename fallback, which turns `drift-detection.md`
 * back into `Drift detection`. Nothing in the type system asks them to agree, so a change to
 * either has to be made to both — otherwise a scaffolded file loads under a name its own
 * frontmatter contradicts.
 */
export declare function slugify(name: string): string;
