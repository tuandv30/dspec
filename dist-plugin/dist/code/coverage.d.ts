import { type Model } from '../model/types';
/** Unclaimed files listed per directory before the rest collapse into a count. */
export declare const DIR_LISTING_CAP = 8;
export interface CoverageDir {
    /** The directory, repo-relative — an observed fact, never an area name. */
    dir: string;
    /** Unclaimed files, capped at `DIR_LISTING_CAP` for display. */
    shown: string[];
    /** How many unclaimed files this directory really has. Always exact. */
    unclaimed: number;
    /** Every source file in the directory, claimed or not — the denominator. */
    total: number;
}
export interface Coverage {
    /** Only directories with at least one unclaimed file, worst first. */
    dirs: CoverageDir[];
    /** Exact totals across the repo — never capped. */
    unclaimed: number;
    claimed: number;
    total: number;
    /** Files a feature claims that are not source files at all — templates, manifests, config.
     *  Not a problem: they are verified to exist, they simply do not count towards coverage. */
    extra: number;
}
export declare function computeCoverage(repo: string, model: Model): Coverage;
