import type { Model, SourceOf } from '../../model/types';
export interface StampReport {
    updated: string[];
    unchanged: number;
    /** Features whose stamp could not be computed, with the reason. */
    skipped: string[];
}
export declare function writeStamps(repo: string, model: Model, sourceOf: SourceOf, write: boolean): StampReport;
