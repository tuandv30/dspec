// ============================================================
// Has a rendered artifact fallen behind the model?
//
// ⚠️ **Answered by RE-RENDERING AND COMPARING CONTENT, never by a version number.** A number in a
// file is a claim the file makes about itself, and a hand-edited file still carries the old one.
// Re-rendering is the only check that cannot be fooled by the thing it is checking.
//
// ⚠️ **Every format, not just the root file.** The index is the entry point; a stale index sends
// every reader to the wrong place while `CLAUDE.md` looks perfectly current.
// ============================================================

import * as fs from 'node:fs';
import * as path from 'node:path';
import type { Model } from '../model/types';
import { parseArtifactStamp, renderAll, withoutTimestamp } from './renderers';

export interface StaleArtifact {
  path: string;
  reason:
    /** The model renders it, and it is not on disk. */
    | 'missing'
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

export function checkArtifacts(repo: string, model: Model): ArtifactReport {
  const stale: StaleArtifact[] = [];
  const unstamped: string[] = [];
  // The timestamp is what a caller would vary; freshness must not depend on it, so a fixed value
  // goes in and `withoutTimestamp` takes it out of both sides of the comparison.
  const fresh = renderAll(model, { projectId: model.product.name, generatedAt: '' });

  for (const file of fresh) {
    const abs = path.join(repo, file.file);
    if (!fs.existsSync(abs)) {
      stale.push({ path: file.file, reason: 'missing', detail: 'has never been rendered — run `ds sync --write`' });
      continue;
    }
    const onDisk = fs.readFileSync(abs, 'utf-8');
    const parsed = parseArtifactStamp(onDisk);
    if (!parsed) {
      // ⚠️ Reported, never overwritten by the check. These names belong to dspec, so finding one
      // it does not manage is worth saying exactly once — and saying it is all this may do.
      unstamped.push(file.file);
      continue;
    }
    if (parsed.projectId !== model.product.name) {
      stale.push({
        path: file.file,
        reason: 'foreign',
        detail: `generated from a different project (\`${parsed.projectId}\`) — copied in from another repo?`,
      });
      continue;
    }
    if (withoutTimestamp(onDisk).trim() !== withoutTimestamp(file.content).trim()) {
      stale.push({ path: file.file, reason: 'behind', detail: 'has fallen behind the model — run `ds sync --write`' });
    }
  }

  return { stale, unstamped };
}
