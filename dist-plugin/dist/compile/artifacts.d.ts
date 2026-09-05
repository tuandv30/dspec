import type { Model } from '../model/types';
export interface StaleArtifact {
    path: string;
    reason: 
    /** The model renders it, and it is not on disk. */
    'missing'
    /** The content no longer matches a fresh render. */
     | 'behind'
    /** Stamped by a different project — copied in from another repo. */
     | 'foreign';
    detail: string;
}
export interface ArtifactReport {
    stale: StaleArtifact[];
    /** Present on disk but carrying no stamp ⇒ hand-written, and deliberately left alone. */
    unstamped: string[];
}
export declare function checkArtifacts(repo: string, model: Model): ArtifactReport;
