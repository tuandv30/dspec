import type { Feature, Model } from '../model/types';
export type StaleKind = 
/** A path in `code:` is not on disk. */
'code_missing'
/** `entry:` is declared in none of the feature's files. */
 | 'entry_lost'
/** A path in `tests:` is gone — the evidence, not the code. */
 | 'test_missing'
/** No stamp, or one written under an older definition. NOTHING is known about freshness. */
 | 'unmeasured'
/** The stamp no longer matches the files. */
 | 'stale';
export interface StaleItem {
    kind: StaleKind;
    feature: string;
    detail: string;
    /** The path or symbol the finding is about. */
    subject?: string;
    /** Where the entry symbol turned up instead. */
    foundAt?: string;
}
/** Short human label per kind. Every report reads it, so there is one spelling. */
export declare const STALE_LABEL: Record<StaleKind, string>;
/** Which kinds a re-stamp actually resolves. The rest need a person. */
export declare const FIXED_BY_SYNC: ReadonlySet<StaleKind>;
export declare function computeStaleness(repo: string, model: Model): StaleItem[];
/** The staleness items for one feature — what the pack prints beside it. */
export declare function stalenessOf(items: StaleItem[], feature: Feature): StaleItem[];
