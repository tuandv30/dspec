// ============================================================
// Manifest — `.ds/install.json`
//
// This is what turns "run `init` again" into a REAL upgrade. Without it, a second install has
// only two possible behaviours and both are wrong: overwrite everything (losing every
// customisation somebody wrote into a command or skill) or skip everything (never receiving a
// newer version).
//
// With a manifest the question becomes answerable: *is this file still exactly as we wrote it?*
// Yes ⇒ we own it, overwrite freely. No ⇒ the user edited it, keep it and say so.
//
// ⚠️ **It must be its own file, not folded into `.ds/config.json`.** `config.json` holds the
// absolute path of a binary on one machine and is therefore gitignored; the manifest describes the
// REPO and must be committed — otherwise the second person to clone sees every file as foreign.
// ============================================================

import * as crypto from 'node:crypto';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { SPEC_DIR } from '../model/load';

export const MANIFEST_FILE = `${SPEC_DIR}/install.json`;

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
export function sha256(text: string): string {
  return crypto.createHash('sha256').update(text, 'utf-8').digest('hex');
}

function manifestPath(repo: string): string {
  return path.join(repo, ...MANIFEST_FILE.split('/'));
}

export function readManifest(repo: string): Manifest | null {
  let raw: string;
  try {
    raw = fs.readFileSync(manifestPath(repo), 'utf-8');
  } catch {
    return null;
  }
  try {
    const m = JSON.parse(raw) as Partial<Manifest>;
    if (!m || typeof m !== 'object') return null;
    return {
      dspec: typeof m.dspec === 'string' ? m.dspec : '0.0.0',
      agents: Array.isArray(m.agents) ? m.agents.filter((a): a is string => typeof a === 'string') : [],
      files: Array.isArray(m.files)
        ? m.files.filter(
            (f): f is ManifestEntry =>
              !!f && typeof f === 'object' && typeof (f as ManifestEntry).path === 'string',
          )
        : [],
    };
  } catch {
    // A corrupt manifest ⇒ treat it as never installed. It is auxiliary memory, not user data:
    // it can be rebuilt, and throwing here would only block the very command that repairs it.
    return null;
  }
}

export function writeManifest(repo: string, m: Manifest): void {
  const p = manifestPath(repo);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  const sorted: Manifest = {
    dspec: m.dspec,
    agents: [...m.agents].sort(),
    // Sorted so a git diff between two installs shows only what genuinely changed.
    files: [...m.files].sort((a, b) => (a.path < b.path ? -1 : a.path > b.path ? 1 : 0)),
  };
  fs.writeFileSync(p, JSON.stringify(sorted, null, 2) + '\n', 'utf-8');
}

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
  | 'added'
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
export function applyFiles(
  repo: string,
  planned: PlannedFile[],
  prev: Manifest | null,
  force = false,
  /** Compute the verdicts without touching disk — `upgrade --dry-run` goes through THIS EXACT
   *  path, so the dry run and the real run cannot disagree. */
  dryRun = false,
): Applied[] {
  const known = new Map<string, string>();
  for (const e of prev?.files ?? []) known.set(e.path, e.sha256);

  const out: Applied[] = [];
  for (const f of planned) {
    const abs = path.join(repo, ...f.path.split('/'));
    const next = sha256(f.content);
    let current: string | null = null;
    try {
      current = fs.readFileSync(abs, 'utf-8');
    } catch {
      /* not there yet */
    }

    let verdict: Verdict;
    if (current === null) verdict = 'added';
    else if (sha256(current) === known.get(f.path)) verdict = current === f.content ? 'unchanged' : 'updated';
    else if (force) verdict = 'overwritten';
    else verdict = 'preserved';

    if (!dryRun && verdict !== 'preserved' && verdict !== 'unchanged') {
      fs.mkdirSync(path.dirname(abs), { recursive: true });
      fs.writeFileSync(abs, f.content, 'utf-8');
      if (f.executable) {
        try {
          fs.chmodSync(abs, 0o755);
        } catch {
          /* Windows, or a filesystem without the bit — hooks still run via `node <file>` */
        }
      }
    }
    // ⚠️ **The sha in the manifest is the sha of what the INSTALLER WROTE**, not of what is on
    // disk. Both wrong ways of recording it lead to the same outcome — a later run overwriting
    // exactly the file we just tried to protect:
    //   - record `next` (our version) ⇒ disk differs from the manifest… but next time we compare
    //     disk against the manifest, see a difference, and still keep it. Correct, but only by
    //     accident.
    //   - record the sha of the USER'S edit ⇒ next time disk MATCHES the manifest ⇒ "this file is
    //     ours" ⇒ overwrite. One `preserved` becomes data loss on the following run.
    // The correct choice is to keep the previous sha: it still describes the last version we
    // wrote, so the question "is disk still as we left it" keeps answering correctly forever.
    const recorded =
      verdict === 'preserved' ? known.get(f.path) ?? null : next;
    out.push({ path: f.path, verdict, agent: f.agent, sha256: recorded });
  }
  return out;
}

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

export const AGENT_KEYS: AgentKey[] = ['claude'];

export function isAgentKey(s: string): s is AgentKey {
  return (AGENT_KEYS as string[]).includes(s);
}
