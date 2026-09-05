/**
 * A wrapper around `node:util.parseArgs` for the NEWER commands (`init`, `upgrade`, `doctor`,
 * `feature`).
 *
 * ⚠️ **Do not touch `argValue` in `commands/compile.ts`.** The older commands (`compile`,
 * `delta`, `map`, `drift`) read argv through it and have tests around them; moving them to a
 * new parser is a refactor nobody asked for, carrying the risk of behaviour changes somewhere
 * unrelated. The two parsers coexist until there is a real reason to merge them.
 *
 * The only difference from bare `parseArgs`: `strict` is on, and errors are reduced to one
 * short line with no stack trace — `main()` prints `✗ <message>`, so the message must stand
 * on its own.
 */
export type FlagType = 'string' | 'boolean';
export interface FlagSpec {
    [name: string]: {
        type: FlagType;
        short?: string;
        multiple?: boolean;
        default?: string | boolean;
    };
}
export interface Parsed<T> {
    values: T;
    positionals: string[];
}
export declare function parseFlags<T = Record<string, unknown>>(args: string[], options: FlagSpec): Parsed<T>;
/** `--touch A/x,B/y` or `--touch A/x --touch B/y` → `['A/x','B/y']`, deduplicated. */
export declare function csv(value: string | string[] | undefined): string[];
