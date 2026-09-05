import { type YamlValue } from './yaml';
export interface Doc {
    /** Parsed frontmatter. No frontmatter ⇒ `{}`, never `null`. */
    meta: {
        [k: string]: YamlValue;
    };
    /** The body, trimmed at both ends. */
    body: string;
}
/**
 * Split one `.md` file.
 *
 * ⚠️ An opening `---` with no closing one is an **error**, not "treat it as having no
 * frontmatter". That happens when somebody — human or agent — leaves an edit half finished;
 * treating the whole file as body makes `codeRef` vanish silently and drops the element back
 * to unbound.
 */
export declare function parseDoc(src: string, where?: string): Doc;
/** Rebuild a `.md` file. Empty meta ⇒ no `---` block at all (do not manufacture noise). */
export declare function renderDoc(doc: Doc): string;
