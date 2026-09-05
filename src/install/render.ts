// ============================================================
// Rendering templates — one source, three shapes
//
// `plugin/` is the ONLY source of every instructional text: it has to keep the shape of a valid
// Claude Code plugin so it can be installed directly, which is why there is no separate
// `templates/` directory generating it back. An adapter therefore has no
// templates of their own — they read the same files and REWRITE the frontmatter and a couple of
// notations.
//
// Two things have to be translated between agents:
//   - **how a command is typed**: `/ds:sync`
//   - **how arguments arrive**: `$1` only means something to Claude
// Both go through placeholders rather than three copies of the prose.
// ============================================================

import { parseDoc, renderDoc, type Doc } from '../model/frontmatter';
import { renderLanguageBlock, type LanguageBlockDepth } from '../model/language';
import type { YamlValue } from '../model/yaml';

const CMD_TOKEN = /__DS_CMD_([A-Z0-9_]+)__/g;

/** `__DS_CMD_SYNC__` → `invoke('sync')`. */
export function substituteCommands(text: string, invoke: (name: string) => string): string {
  return text.replace(CMD_TOKEN, (_m, raw: string) => invoke(raw.toLowerCase().replace(/_/g, '-')));
}

const ARG_TOKEN = /\$ARGUMENTS\b|\$\d\b/g;
const CODE_SPAN = /`[^`\n]*`/g;

/**
 * Claude's `$1` / `$ARGUMENTS` into something the other agents understand.
 *
 * Where an agent has no argument variable we substitute **prose** rather than invent one. The
 * reason: their variable syntaxes still shift between releases, and an unsubstituted
 * placeholder reaches the prompt as `${input:args}` — an agent reading that asks the user about
 * a variable that does not exist. A plain English phrase reads correctly in every case.
 *
 * ⚠️ **Except inside a code span.** Replacing `` `ds spec $1` `` with prose produces
 * `` `ds spec whatever you typed after this command` `` — and an agent reads a code span
 * as a command line to type verbatim. Inside a code span the token is REMOVED along with the
 * whitespace before it: the remaining command still runs, it just loses its optional part.
 */
export function substituteArgs(text: string, form: string): string {
  const spans = text.replace(CODE_SPAN, (m) => m.replace(/\s*(?:\$ARGUMENTS\b|\$\d\b)/g, ''));
  return spans.replace(ARG_TOKEN, form);
}

/** New meta for a file — `undefined` means drop that key. */
export type MetaPatch = { [k: string]: YamlValue | undefined };

/** Replace the frontmatter, keep the body. Keys set to `undefined` are removed. */
export function withMeta(doc: Doc, patch: MetaPatch): Doc {
  const meta: { [k: string]: YamlValue } = { ...doc.meta };
  for (const [k, v] of Object.entries(patch)) {
    if (v === undefined) delete meta[k];
    else meta[k] = v;
  }
  return { meta, body: doc.body };
}

/** Keep exactly these keys, in exactly this order. */
export function onlyMeta(doc: Doc, keys: string[]): Doc {
  const meta: { [k: string]: YamlValue } = {};
  for (const k of keys) if (doc.meta[k] !== undefined) meta[k] = doc.meta[k];
  return { meta, body: doc.body };
}

export { parseDoc, renderDoc };
export type { Doc };

const DOC_TOKEN = /__DS_LANG_(LINE|TABLE|FULL)__/g;

/**
 * `__DS_LANG_TABLE__` → the vocabulary table generated from `src/model/language.ts`.
 *
 * ⚠️ **This is how seven hand-written copies became one.** The `Rules/Input/Errors/Effects/
 * Visibility` vocabulary is what the linter penalises against; every document teaching an agent
 * to write to it must be generated from the same place, or a user who reads a stale copy gets
 * penalised for following the documentation.
 *
 * The known trade-off: read raw, `plugin/` now shows a placeholder line instead of the real
 * text, so it is slightly less self-explanatory. The placeholder names itself, and
 * `install-agents.test.js` asserts no `__DS_` token survives into an installed file.
 */
export function substituteDocs(text: string): string {
  return text.replace(DOC_TOKEN, (_m, depth: string) =>
    renderLanguageBlock(depth.toLowerCase() as LanguageBlockDepth),
  );
}
