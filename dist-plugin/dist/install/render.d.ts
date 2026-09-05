import { parseDoc, renderDoc, type Doc } from '../model/frontmatter';
import type { YamlValue } from '../model/yaml';
/** `__DS_CMD_SYNC__` → `invoke('sync')`. */
export declare function substituteCommands(text: string, invoke: (name: string) => string): string;
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
export declare function substituteArgs(text: string, form: string): string;
/** New meta for a file — `undefined` means drop that key. */
export type MetaPatch = {
    [k: string]: YamlValue | undefined;
};
/** Replace the frontmatter, keep the body. Keys set to `undefined` are removed. */
export declare function withMeta(doc: Doc, patch: MetaPatch): Doc;
/** Keep exactly these keys, in exactly this order. */
export declare function onlyMeta(doc: Doc, keys: string[]): Doc;
export { parseDoc, renderDoc };
export type { Doc };
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
export declare function substituteDocs(text: string): string;
