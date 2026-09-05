export type YamlValue = string | number | boolean | null | YamlValue[] | {
    [k: string]: YamlValue;
};
export declare class YamlError extends Error {
    readonly line: number;
    readonly where?: string | undefined;
    constructor(message: string, line: number, where?: string | undefined);
}
/**
 * Parse a YAML document (the subset). Empty input ⇒ `{}` — that is "nothing declared", which is
 * valid. Every other syntax error throws a `YamlError`.
 */
/**
 * Parse the YAML subset.
 *
 * `firstLine` is the SOURCE line number of `src`'s first line. It exists because the caller that
 * matters — `parseDoc` — hands over the frontmatter with the opening `---` already stripped, so
 * without it every error would name a line one above the one you have to open.
 */
export declare function parseYaml(src: string, where?: string, firstLine?: number): YamlValue;
/**
 * Serialise to YAML — **dropping every empty key**.
 *
 * `codeRef: {}`, `actors: []` and `description: ""` carry nothing `parseYaml` could not infer
 * from their absence, and they bloat exactly the frontmatter a user reads every day. More
 * importantly: `codeRef: {}` reads as "an empty codeRef was declared" when the truth is "none was
 * declared" — those two must not look the same.
 */
export declare function dumpYaml(v: YamlValue): string;
