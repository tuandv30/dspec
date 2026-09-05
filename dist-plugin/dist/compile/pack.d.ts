import { type Feature, type Model } from '../model/types';
export interface PackOptions {
    /** Names seeded by hand. They always win outright over what the request resolved to. */
    touch?: string[];
}
export interface Resolution {
    /** The features the request names, in the order they were found. */
    hits: Feature[];
    /** `--touch` names that resolve to nothing — reported, never silently dropped. */
    unresolved: string[];
}
/**
 * Resolve a request to features.
 *
 * Two tiers, both exact: the request IS a feature name, or a feature's whole name occurs inside
 * it on word boundaries. Nothing weaker. A name occurring inside a sentence is a statement the
 * writer made; an overlapping token is a coincidence the tool would be inventing meaning from.
 */
export declare function resolve(model: Model, request: string, opts?: PackOptions): Resolution;
export interface Suggestion {
    feature: Feature;
    /** The request's words this feature matched, for the reader to judge rather than trust. */
    shared: string[];
    score: number;
}
/**
 * Rank features by words shared with the request. **A guess, and labelled as one everywhere it is
 * rendered.**
 *
 * ⚠️ **A name hit outweighs a body hit**, because the two are not equal evidence: a word in the
 * feature's own name is what somebody chose to call it, while a word in a paragraph may be an
 * aside. Without the weighting, a long body full of incidental vocabulary outranks the feature the
 * request is actually about — which is how a search that "works" starts recommending whichever
 * feature happens to be the most verbose.
 */
export declare function suggest(model: Model, request: string, exclude?: Feature[]): Suggestion[];
/** The depth-1 closure: the features named, plus everything they use. */
export declare function closure(model: Model, seeds: Feature[]): {
    seeds: Feature[];
    used: Feature[];
};
export declare function renderPack(repo: string, model: Model, request: string, opts?: PackOptions): string;
