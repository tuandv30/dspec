import { type Model } from '../model/types';
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
export declare function parseArtifactStamp(content: string): {
    projectId: string;
} | null;
/** Drop the one field that changes on every render and says nothing about staleness. */
export declare function withoutTimestamp(s: string): string;
/**
 * The index — one read that answers *what* and *where* for the whole product.
 *
 * ⚠️ **Areas are ordered alphabetically, not by appearance.** A reader returning to this file must
 * find a feature where they left it; ordering by whatever the directory walk happened to return
 * would move headings around whenever a file is renamed.
 */
export declare function renderIndex(model: Model, p: ArtifactStamp): CompiledFile;
/**
 * The pointer.
 *
 * It carries the product rules and nothing else from the model, because those are the only lines
 * that apply to every change. Everything else is one lookup away, and a lookup that costs one file
 * read is cheaper than a copy that costs every turn.
 */
export declare function renderClaudeMd(model: Model, p: ArtifactStamp): CompiledFile;
/** Every artifact this model renders to. One list, so nothing can render a file the check forgets. */
export declare function renderAll(model: Model, p: ArtifactStamp): CompiledFile[];
