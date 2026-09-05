/** The unit of dspec-lang: one feature, one file, one name. */
export interface Feature {
    /** The address. Unique across the model, and what `uses` resolves against. */
    name: string;
    /** A label that groups the index. Not a boundary: nothing is filed inside one. */
    area: string;
    /** Every file this feature lives in, repo-relative. At least one, or it describes nothing. */
    code: string[];
    /** Where to start reading — a symbol declared in one of `code`. */
    entry?: string;
    /** The features this one depends on, by `name`. THE ONLY EDGES IN THE MODEL. */
    uses: string[];
    /** Tests that actually prove what this file describes. Never inferred from a filename. */
    tests: string[];
    /**
     * Fingerprint of the `code` files, written by `ds sync`.
     *
     * ⚠️ **Absent means NOTHING IS KNOWN about freshness** — never "fine". The distinction is the
     * whole reason this is optional rather than defaulted: a model that reports an unmeasured
     * feature as current is worse than one that reports nothing at all.
     */
    stamp?: string;
    /** The prose before the first label — what this is, in product terms. */
    lead: string;
    /** Lines under `Rules`. */
    rules: string[];
    /** Lines under `Behaviour`. */
    behaviour: string[];
    /** The body exactly as written, for renderers that pass it through untouched. */
    body: string;
}
/** `product.md` — the vision and the rules that outlive every feature. */
export interface Product {
    name: string;
    /** The prose before the first label. */
    vision: string;
    /** Lines under `Rules` — prepended to every answer the model gives, so it stays short. */
    rules: string[];
}
export interface Model {
    product: Product;
    /** `glossary.md`, passed through verbatim. Prose for a reader, never parsed. */
    glossary: string;
    features: Feature[];
}
/** Where each feature was read from — keyed by object identity, never by name.
 *
 * ⚠️ Identity is the object. Keying by name collapses two same-named features onto one file, and
 * the stamp writer would then put one feature's fingerprint into the other's file — a wrong value
 * that reads exactly like a right one, and that no later run could correct.
 */
export type SourceOf = Map<Feature, string>;
export interface Loaded {
    model: Model;
    sourceOf: SourceOf;
}
/** The first sentence of the lead — what the index prints. Derived, never stored. */
export declare function summaryOf(f: Feature): string;
/** Features grouped by `area`, each group sorted by name. Insertion order of areas is preserved. */
export declare function byArea(features: Feature[]): Map<string, Feature[]>;
/** Case- and whitespace-insensitive lookup key. One definition, used by every resolver. */
export declare const normName: (s: string) => string;
/** Find a feature by name. `uses` and `ds spec` must resolve identically, so both ask here. */
export declare function findFeature(model: Model, name: string): Feature | undefined;
/** Every file claimed by any feature → the features claiming it. */
export declare function claims(features: Feature[]): Map<string, Feature[]>;
