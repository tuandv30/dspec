import { type Feature, type Model } from '../model/types';
/**
 * Every rule this linter can report.
 *
 * ⚠️ **An ARRAY, so the count can be derived rather than typed.** The CLI usage, the README and
 * the changelog all describe the linter as "N rules"; kept by hand, those copies disagree the
 * first time a rule is added, and the user reading a stale number is being told something false
 * by the tool itself.
 */
export declare const LINT_RULE_CODES: readonly ["duplicate_name", "missing_code", "unresolved_use", "missing_test", "no_body", "unclaimed_code"];
export type LintCode = (typeof LINT_RULE_CODES)[number];
export type Severity = 'error' | 'warn' | 'info';
export declare const SEVERITY: Record<LintCode, Severity>;
export interface Finding {
    code: LintCode;
    severity: Severity;
    /** The feature the finding is about; absent for repo-level findings. */
    feature?: string;
    /** The path, name or symbol at fault. */
    subject?: string;
    detail: string;
}
/**
 * The rules answerable from the model alone — a pure function, so it is deterministic and
 * snapshot-testable, and so a caller holding only a model can still ask.
 *
 * The rules that need the checkout live in `lintRepo` below, because a rule that silently returns
 * nothing when it cannot read the disk is worse than one that is not asked.
 */
export declare function lintModel(model: Model): Finding[];
/**
 * Every rule, including the ones that must read the checkout.
 *
 * It composes `computeStaleness` and `computeCoverage` rather than re-deriving their answers: two
 * implementations of "is this path on disk" would disagree the day either is touched, and nothing
 * would record it.
 */
export declare function lintRepo(repo: string, model: Model): Finding[];
/** Features claiming the same file — not a finding, but what the post-edit hook prints. */
export declare function featuresClaiming(model: Model, file: string): Feature[];
