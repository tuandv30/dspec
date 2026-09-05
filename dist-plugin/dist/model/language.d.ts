/**
 * The frontmatter keys of a feature file, in the order they should be written.
 *
 * Changing this changes the language: the loader, the linter, the scaffolder and every generated
 * document read from here, so they can no longer disagree.
 */
export declare const FEATURE_KEYS: readonly ["name", "area", "code", "entry", "uses", "tests", "stamp"];
export type FeatureKey = (typeof FEATURE_KEYS)[number];
export interface KeyDoc {
    name: FeatureKey;
    required: boolean;
    /** `you` = a person or their agent writes it · `cli` = the tool writes it, never a human. */
    writer: 'you' | 'cli';
    gloss: string;
}
export declare const KEYS: KeyDoc[];
/**
 * The labels of a feature body, in recommended order.
 *
 * Two, down from five. `Input`, `Errors` and `Effects` were symbol-level concerns: at the level of
 * a feature they belong inside `Behaviour`, and asking a writer to classify a sentence into five
 * buckets bought nothing the reader could use.
 */
export declare const BODY_LABELS: readonly ["Rules", "Behaviour"];
export type BodyLabel = (typeof BODY_LABELS)[number];
export interface LabelDoc {
    name: BodyLabel;
    gloss: string;
    example: string;
}
export declare const LABELS: LabelDoc[];
/** The lead paragraph carries no label. Named here so generated docs describe it consistently. */
export declare const LEAD_GLOSS = "The prose before the first label: what this feature IS, in product terms. One paragraph.";
/**
 * `line`  — one sentence, for tight spaces (a seeded file, a command footer).
 * `table` — the keys and the labels as tables.
 * `full`  — the tables, the two rules, and a worked example file.
 */
export type LanguageBlockDepth = 'line' | 'table' | 'full';
/** The labels joined by ` · ` — the shortest form, usable inside a sentence. */
export declare function labelLine(): string;
/** The required keys joined by ` · `. */
export declare function requiredKeyLine(): string;
/** A worked feature file built FROM the declarations, so it can never drift from them. */
export declare function exampleFeature(): string;
export declare function renderLanguageBlock(depth: LanguageBlockDepth): string;
