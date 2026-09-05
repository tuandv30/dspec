// ============================================================
// The model → the files an agent actually reads
//
// Two artifacts, and the difference between them is the point:
//
//   `.ds/index.md`  the ENTRY POINT. Every feature, one line: what it is and where it lives.
//   `CLAUDE.md`     a POINTER at that index, plus the product rules.
//
// ⚠️ **`CLAUDE.md` is not a copy of the model.** Rendered from every element it would grow
// so it grew with the model — 88 KB for a model of a hundred elements — and every byte was billed
// to every agent call, on every turn. A pointer costs a few lines and sends the reader to the one
// file they need.
//
// ⚠️ **A renderer is a pure function.** The generation timestamp is a PARAMETER, never read from
// the clock inside: reading it here would turn every snapshot red on every run, and the only
// remaining fix would be to strip the one line that matters.
// ============================================================

import { byArea, summaryOf, type Model } from '../model/types';
import { FEATURES_DIR, INDEX_FILE, SPEC_DIR } from '../model/load';

export interface CompiledFile {
  /** Path relative to the repo root. */
  file: string;
  format: 'index' | 'claude_md';
  content: string;
}

/** The identity of one render run, stamped onto the files it produces. */
export interface ArtifactStamp {
  /** Which project produced this file — catches an artifact copied in from another repo. */
  projectId: string;
  /** ISO 8601. Supplied by the caller. */
  generatedAt: string;
}

/**
 * Why the stamp has to exist: without it, a **generated** file and a **hand-written** one are two
 * files that look identical. People edit the very file the next render overwrites — losing their
 * words, with nothing to warn them. It is also what lets the check tell "stale" apart from "this
 * was never ours".
 */
export function parseArtifactStamp(content: string): { projectId: string } | null {
  const m = /ds:\s*"?project=(\S+)/.exec(content.slice(0, 512));
  return m ? { projectId: m[1] } : null;
}

const stampLine = (p: ArtifactStamp): string =>
  `<!-- ds: project=${p.projectId} generated=${p.generatedAt} -->`;

/** Drop the one field that changes on every render and says nothing about staleness. */
export function withoutTimestamp(s: string): string {
  return s.replace(/generated=\S*/, '');
}

// ─── `.ds/index.md` ─────────────────────────────────────────────────────────

/**
 * The index — one read that answers *what* and *where* for the whole product.
 *
 * ⚠️ **Areas are ordered alphabetically, not by appearance.** A reader returning to this file must
 * find a feature where they left it; ordering by whatever the directory walk happened to return
 * would move headings around whenever a file is renamed.
 */
export function renderIndex(model: Model, p: ArtifactStamp): CompiledFile {
  const lines: string[] = [
    stampLine(p),
    `# ${model.product.name} — product index`,
    '',
    'Every feature in this product: what it is, where it lives, and what it depends on.',
    `Generated from \`${SPEC_DIR}/${FEATURES_DIR}/\` — do not edit by hand.`,
    '',
  ];

  const groups = [...byArea(model.features).entries()].sort((a, b) => a[0].localeCompare(b[0]));
  for (const [area, features] of groups) {
    lines.push(`## ${area || 'No area'}`, '');
    for (const f of features) {
      const summary = summaryOf(f);
      lines.push(`- **${f.name}**${summary ? ` — ${summary}` : ''}`);
      const where = f.code.map((c) => `\`${c}\``).join(', ');
      const uses = f.uses.length ? ` · uses: ${f.uses.join(', ')}` : '';
      lines.push(`  → ${where}${uses}`);
    }
    lines.push('');
  }

  if (!model.features.length) {
    lines.push('_No features described yet. Run `ds sync --write` to scaffold from the code._', '');
  }

  return { file: `${SPEC_DIR}/${INDEX_FILE}`, format: 'index', content: lines.join('\n').replace(/\n+$/, '\n') };
}

// ─── `CLAUDE.md` ────────────────────────────────────────────────────────────

/**
 * The pointer.
 *
 * It carries the product rules and nothing else from the model, because those are the only lines
 * that apply to every change. Everything else is one lookup away, and a lookup that costs one file
 * read is cheaper than a copy that costs every turn.
 */
export function renderClaudeMd(model: Model, p: ArtifactStamp): CompiledFile {
  const lines: string[] = [
    stampLine(p),
    `# ${model.product.name}`,
    '',
    `This repository's product model lives in \`${SPEC_DIR}/\`, written in dspec-lang.`,
    '',
    `**Start at \`${SPEC_DIR}/${INDEX_FILE}\`** — every feature, what it is, and which files it`,
    'lives in. Then read the one feature file you need; do not read the whole model, and do not',
    'read this file to find out what a feature does.',
    '',
  ];

  if (model.product.vision.trim()) lines.push(model.product.vision.trim(), '');

  if (model.product.rules.length) {
    lines.push('## Rules', '', '_Non-negotiable, and they apply to every change._', '');
    lines.push(...model.product.rules);
    lines.push('');
  }

  lines.push(
    '---',
    '',
    '_Generated from the model by `ds sync`. Never edit this file by hand — it is overwritten._',
    '',
  );

  return { file: 'CLAUDE.md', format: 'claude_md', content: lines.join('\n').replace(/\n+$/, '\n') };
}

/** Every artifact this model renders to. One list, so nothing can render a file the check forgets. */
export function renderAll(model: Model, p: ArtifactStamp): CompiledFile[] {
  return [renderIndex(model, p), renderClaudeMd(model, p)];
}
