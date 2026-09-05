export declare function cmdBootstrap(argv: string[]): Promise<number>;
/**
 * Contexts whose compiled rule file would land on top of a rule the user wrote themselves.
 *
 * Only UNSTAMPED files count as a clash: a `.claude/rules/ordering.md` that dspec generated on
 * the last compile is not a collision, it is the artifact being kept up to date. Reporting it
 * would put a warning on every single install of a healthy repo, and a warning that is always
 * there is one nobody reads on the day it means something.
 */
