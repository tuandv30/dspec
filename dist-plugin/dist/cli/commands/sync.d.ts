import { type Coverage } from '../../code/coverage';
import { type StaleItem } from '../../code/staleness';
import { type Finding } from '../../compile/lint';
import { type WorkItem } from '../../compile/worklist';
export interface SyncReport {
    items: WorkItem[];
    coverage: Coverage;
    /** Base files this run put back. Empty whenever the model is intact. */
    restored: string[];
    /** Every measured disagreement between a description and its code. Read by the Stop hook. */
    staleness: StaleItem[];
    findings: Finding[];
}
export interface SyncOptions {
    /** Skip the checkout walk — the slowest half. The session hook cannot afford it. */
    skipCode?: boolean;
}
export declare function buildSyncReport(repo: string, opts?: SyncOptions): SyncReport;
/**
 * The failures a CI run should stop on — measured facts only, never an opinion.
 *
 * ⚠️ **Code without a description is NOT one of them**, and neither is a body nobody has written
 * yet. A gate that reddens on every new file teaches people to route around it, and then the model
 * rots with the gate still green. Nor is "never measured": that means nothing is known yet, and
 * failing on it would conflate *unknown* with *wrong* — the one distinction this tool exists to
 * keep.
 */
export declare function failures(repo: string, report: SyncReport): string[];
/**
 * The code→model half, rendered.
 *
 * ⚠️ It says **decide**, not **add**. Not every file deserves a feature — a helper module
 * described in the model is noise that buries the features that matter — and which of them is
 * worth writing down is exactly the judgement this command has no way to make.
 */
export declare function reportCoverage(coverage: Coverage): void;
export declare function cmdSync(args: string[]): number;
