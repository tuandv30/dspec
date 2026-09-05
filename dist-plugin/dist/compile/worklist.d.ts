import type { Model } from '../model/types';
export interface WorkItem {
    kind: 'handover' | 'stale' | 'quality' | 'coverage' | 'artifact';
    title: string;
    detail?: string;
    /** The command that resolves it. Absent when only a person can. */
    next?: string;
}
export interface WorkOptions {
    /** Skip the checkout walk — it reads real source and is the slowest part of the answer. */
    skipCode?: boolean;
}
export declare function buildWorkList(repo: string, model: Model, opts?: WorkOptions): WorkItem[];
