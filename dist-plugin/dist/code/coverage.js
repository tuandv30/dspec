"use strict";
// ============================================================
// code → model: what does no feature describe?
//
// Staleness walks the model and asks whether the code it names still matches. That only ever finds
// problems in things somebody already wrote down, so it is structurally blind to the failure this
// product exists to prevent: a feature shipped that the model never mentions. This module asks the
// mirror question, and the two together are what make `ds sync` a reconciliation rather than a
// one-way check.
//
// ⚠️ **It counts FILES, not symbols.** Asking per declaration answers with
// hundreds of private helpers — a number nobody could act on, so nobody read it. A repository has
// tens of source files, and "no feature describes `src/git/rev.ts`" is a question a person can
// actually answer.
//
// ⚠️ **It observes; it never concludes.** Not every file deserves a feature. Which ones do is a
// judgement, and this module makes none: it lists, and says so.
// ============================================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.DIR_LISTING_CAP = void 0;
exports.computeCoverage = computeCoverage;
const types_1 = require("../model/types");
const sources_1 = require("./sources");
/** Unclaimed files listed per directory before the rest collapse into a count. */
exports.DIR_LISTING_CAP = 8;
const dirOf = (rel) => {
    const i = rel.lastIndexOf('/');
    return i === -1 ? '.' : rel.slice(0, i);
};
function computeCoverage(repo, model) {
    const sources = (0, sources_1.trackedSources)(repo);
    const claimed = (0, types_1.claims)(model.features);
    const byDir = new Map();
    let unclaimedTotal = 0;
    for (const rel of sources) {
        const d = dirOf(rel);
        const bucket = byDir.get(d) ?? { unclaimed: [], total: 0 };
        bucket.total++;
        if (!claimed.has(rel)) {
            bucket.unclaimed.push(rel);
            unclaimedTotal++;
        }
        byDir.set(d, bucket);
    }
    const dirs = [...byDir.entries()]
        .filter(([, b]) => b.unclaimed.length)
        .map(([dir, b]) => ({
        dir,
        shown: b.unclaimed.slice(0, exports.DIR_LISTING_CAP),
        unclaimed: b.unclaimed.length,
        total: b.total,
    }))
        .sort((a, b) => b.unclaimed - a.unclaimed || a.dir.localeCompare(b.dir));
    const sourceSet = new Set(sources);
    let extra = 0;
    for (const p of claimed.keys())
        if (!sourceSet.has(p))
            extra++;
    return {
        dirs,
        unclaimed: unclaimedTotal,
        claimed: sources.length - unclaimedTotal,
        total: sources.length,
        extra,
    };
}
//# sourceMappingURL=coverage.js.map