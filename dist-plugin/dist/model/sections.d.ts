import { BODY_LABELS, type BodyLabel } from './language';
export { BODY_LABELS };
export type { BodyLabel };
export interface Body {
    /** Everything before the first label. Never discarded — see below. */
    lead: string;
    /** Non-blank lines under each label, keyed by the canonical label name. */
    sections: Map<BodyLabel, string[]>;
}
/**
 * Split a body into its lead and its labelled sections.
 *
 * ⚠️ **Prose under an unrecognised label is kept, not dropped.** A writer reaching for a sixth
 * label has written something real; silently discarding it would lose their words while the
 * rendered artifact looked complete. It stays with whatever section it followed, and the linter
 * says nothing — a label nobody recognises costs a heading in the output, where it is visible
 * immediately, which is a different class of mistake from one that hides.
 */
export declare function parseBody(text: string): Body;
/** The lines under one label, or `[]`. */
export declare function section(body: Body, name: BodyLabel): string[];
