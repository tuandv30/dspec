import { type Model } from '../../model/types';
export interface Proposal {
    name: string;
    area: string;
    code: string[];
    /** Where it would be written, repo-relative. */
    file: string;
}
/**
 * One proposal per directory holding unclaimed source.
 *
 * A directory is the only grouping readable from a checkout without inventing intent. It is
 * almost certainly the wrong boundary — that is why the scaffolded file says so out loud, and why
 * the command that calls this puts the question to the user rather than deciding.
 */
export declare function proposeFeatures(repo: string, model: Model): Proposal[];
/**
 * The scaffolded file.
 *
 * ⚠️ **Guidance lives in frontmatter comments, never in the body.** A body is rendered into the
 * index and read by every agent, so an instructional note there is billed on every call forever;
 * it would also silence `no_body`, the rule that makes this scaffold a worklist. The parser strips
 * these comments, and the first `ds sync --write` that writes a stamp removes them — which is the
 * right lifetime.
 */
export declare function renderProposal(p: Proposal): string;
/** Write proposals that do not already exist. Existing files are never touched. */
export declare function writeProposals(repo: string, proposals: Proposal[]): string[];
