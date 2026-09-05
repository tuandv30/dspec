export declare const MANIFEST_FILE = ".ds/install.json";
export interface ManifestEntry {
    /** Path relative to the repo root, always using `/` even on Windows. */
    path: string;
    sha256: string;
    /** Which agent produced this file — so `upgrade` can reason about an agent that was dropped. */
    agent: string;
}
export interface Manifest {
    /** The `dspec` version that wrote this last. */
    dspec: string;
    agents: string[];
    files: ManifestEntry[];
}
/**
 * Hash the CONTENT, never mtime or size.
 *
 * mtime changes on every checkout; sizes collide far too easily. Either would claim "the user
 * edited this" precisely when they had not, which is the fastest way for `upgrade` to lose
 * credibility and be run with `--force` forever after.
 */
export declare function sha256(text: string): string;
export declare function readManifest(repo: string): Manifest | null;
export declare function writeManifest(repo: string, m: Manifest): void;
/** A file the installer intends to write. */
export interface PlannedFile {
    /** Relative to the repo root, separated by `/`. */
    path: string;
    content: string;
    agent: string;
    /** `true` for hook scripts — they need the executable bit on Unix. */
    executable?: boolean;
}
export type Verdict = 
/** Never existed on disk. */
'added'
/** Present, matches the manifest (⇒ ours), and the new content differs ⇒ overwritten. */
 | 'updated'
/** Present, matches the manifest, content unchanged. */
 | 'unchanged'
/** Present, does NOT match the manifest ⇒ the user edited it ⇒ left alone. */
 | 'preserved'
/** Edited by hand, but `--force` was given ⇒ overwritten anyway. */
 | 'overwritten';
export interface Applied {
    path: string;
    verdict: Verdict;
    agent: string;
    /**
     * The sha to record in the manifest, or `null` ⇒ **record no entry at all**.
     *
     * This is the sha of what the INSTALLER WROTE, not the sha of what is currently on disk — see
     * the note inside `applyFiles`.
     */
    sha256: string | null;
}
/**
 * Write the planned files, respecting what the user has edited.
 *
 * Three branches, and the middle one is why this module exists at all:
 * - the file does not exist ⇒ `added`
 * - it exists and its sha matches the manifest ⇒ we own it ⇒ write the new version
 * - it exists and its sha DIFFERS ⇒ the user edited it ⇒ **do not touch it**, return `preserved`
 *
 * With no manifest (a first install, or one that was deleted) an existing file is assumed to be
 * the user's. Erring cautious is correct: keeping one wrongly costs a line of warning, while
 * overwriting one wrongly loses hand-written work with no backup anywhere.
 */
export declare function applyFiles(repo: string, planned: PlannedFile[], prev: Manifest | null, force?: boolean, 
/** Compute the verdicts without touching disk — `upgrade --dry-run` goes through THIS EXACT
 *  path, so the dry run and the real run cannot disagree. */
dryRun?: boolean): Applied[];
/**
 * The agent an installed file belonged to.
 *
 * ⚠️ **A union of one, kept because `install.json` on disk says `"agent": "..."`.** dspec is a
 * Claude Code plugin now and installs no agent files at all, but manifests written by older
 * versions carry `cursor` and `copilot` entries. Collapsing this to a bare string would let a
 * stale value flow into code that assumes it is a live target; keeping the union means
 * `isAgentKey` says "no" and the entry is carried, untouched, rather than acted on.
 */
export type AgentKey = 'claude';
export declare const AGENT_KEYS: AgentKey[];
export declare function isAgentKey(s: string): s is AgentKey;
