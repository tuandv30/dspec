"use strict";
// ============================================================
// "What does this project still owe?" — **derived, never stored**
//
// ⚠️ **No file may be added to answer this question.** Everything is already here: git says which
// descriptions changed without being committed, the staleness walk says where the code disagrees,
// the linter says which are thin, coverage says what nothing describes, and a re-render says
// whether an artifact has fallen behind. A `todo.md` would be a SECOND source of truth for
// something already known — it starts synchronised, then drifts, and then people trust it instead
// of the model.
// ============================================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildWorkList = buildWorkList;
const rev_1 = require("../git/rev");
const coverage_1 = require("../code/coverage");
const staleness_1 = require("../code/staleness");
const artifacts_1 = require("./artifacts");
const lint_1 = require("./lint");
const load_1 = require("../model/load");
const text_1 = require("../text");
function buildWorkList(repo, model, opts = {}) {
    const items = [];
    const changed = (0, rev_1.changedModelFiles)(repo, load_1.SPEC_DIR);
    if (changed.length) {
        // ⚠️ **No `next` here, deliberately.** The loop is code-first: `.ds/` is written after the
        // code exists, so an uncommitted description is normally work that is already done, not work
        // that is owed. Pointing anywhere would send the reader to redo something finished.
        items.push({
            kind: 'handover',
            title: `${(0, text_1.plural)(changed.length, 'model file')} changed but not committed`,
            detail: changed.slice(0, 5).join(', ') + (changed.length > 5 ? ` +${changed.length - 5}` : ''),
        });
    }
    if (!opts.skipCode) {
        for (const s of (0, staleness_1.computeStaleness)(repo, model)) {
            items.push({
                kind: 'stale',
                title: `[${staleness_1.STALE_LABEL[s.kind]}] ${s.feature}`,
                detail: s.detail,
                next: staleness_1.FIXED_BY_SYNC.has(s.kind) ? 'ds sync --write' : undefined,
            });
        }
    }
    // Quality: only the rule that means "an agent will have to guess here". Dumping every finding
    // into the work list would drown the three lines worth reading; the full
    // list belongs in the report `ds sync` prints under it.
    for (const f of (0, lint_1.lintModel)(model)) {
        if (f.code !== 'no_body')
            continue;
        items.push({ kind: 'quality', title: `no description: ${f.feature}`, detail: f.detail });
    }
    if (!opts.skipCode) {
        const coverage = (0, coverage_1.computeCoverage)(repo, model);
        if (coverage.unclaimed) {
            items.push({
                kind: 'coverage',
                title: `${(0, text_1.plural)(coverage.unclaimed, 'source file')} no feature describes`,
                detail: coverage.dirs.slice(0, 3).map((d) => `${d.dir} ${d.unclaimed}/${d.total}`).join(', '),
            });
        }
    }
    // ⚠️ Through `checkArtifacts`, so this and `sync --strict` cannot disagree — and so every rendered
    // format is covered rather than only the one somebody remembered.
    for (const a of (0, artifacts_1.checkArtifacts)(repo, model).stale) {
        items.push({ kind: 'artifact', title: `${a.path} ${a.detail}`, next: 'ds sync --write' });
    }
    return items;
}
//# sourceMappingURL=worklist.js.map