/** Was this stamp written under a different definition of the input? */
export declare function isLegacyStamp(stamp: string | undefined | null): boolean;
/** Is this a stamp this dspec can compare against? */
export declare function isCurrentStamp(stamp: string | undefined | null): boolean;
/**
 * Strip the parts of a symbol body that carry no behaviour, so reformatting is not drift.
 *
 * ⚠️ **Conservative on purpose, and the asymmetry is deliberate.** A false positive — reporting
 * drift after somebody ran a formatter — is noise that teaches people to ignore the report. A
 * false negative — calling changed code unchanged — is the silent failure this whole product
 * exists to prevent. So this removes only what provably cannot carry meaning, and nothing that
 * might:
 *
 *   - line endings, so a CRLF checkout is not permanent drift
 *   - comments, which by definition do not execute
 *   - trailing whitespace and blank lines
 *   - the WIDTH of indentation, so a 2-space block and a 4-space block agree
 *
 * ⚠️ **Indentation STRUCTURE is preserved, only its width is not.** Each line's indent is
 * replaced by its rank among the distinct indents in the block, so `0, 2, 2` and `0, 4, 4` both
 * become `0, 1, 1` — while `0, 2, 0` stays `0, 1, 0` and still differs. Flattening indentation
 * outright would make `if x:` with two indented lines hash the same as one indented and one not:
 * a real behavioural change in Python reported as clean, which is the failure worth avoiding.
 *
 * What it deliberately does NOT do is normalise spacing inside a line. `a  +  b` still differs
 * from `a + b`, because without parsing there is no way to tell code spacing from the inside of
 * a string literal, and quietly rewriting a string is a false negative.
 */
export declare function normalise(body: string): string;
export interface StampResult {
    /** `null` when any declared file could not be read — a partial stamp would be a lie. */
    stamp: string | null;
    /** Declared paths that are not on disk, in declared order. */
    missing: string[];
}
/**
 * Fingerprint a feature's file set.
 *
 * ⚠️ **Order-independent.** The input is `path:hash` lines SORTED BY PATH, so reordering the
 * `code:` list is not a change. Hashing the files in declared order would report drift for an
 * edit nobody made to the code — and a warning that fires on a cosmetic edit is a warning people
 * learn to skip.
 *
 * ⚠️ **A missing file yields no stamp at all.** Stamping the files that happen to exist would
 * produce a value that looks measured, matches on the next run, and quietly asserts freshness for
 * a feature pointing at a file that is gone.
 */
export declare function stampFiles(repo: string, files: string[], cache?: Map<string, string>): StampResult;
/** Does this source declare `symbol`? The check behind `entry:`. */
export declare function declaresSymbol(source: string, symbol: string): boolean;
/**
 * Which of these files declares `symbol` — how "the entry moved" is told apart from "it is gone".
 *
 * Reporting only "not found" would leave the reader to grep for it themselves, which is the work
 * the tool is standing in the repo to do.
 */
export declare function findSymbolIn(repo: string, symbol: string, candidates: string[]): string | null;
