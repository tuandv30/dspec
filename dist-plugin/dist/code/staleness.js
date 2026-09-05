"use strict";
// ============================================================
// model → code: has anything a feature declared stopped being true?
//
// Every answer is read from the checkout. This is the half of reconciliation that looks at what
// somebody already wrote down; `coverage.ts` is the half that looks at what they did not.
// ============================================================
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.FIXED_BY_SYNC = exports.STALE_LABEL = void 0;
exports.computeStaleness = computeStaleness;
exports.stalenessOf = stalenessOf;
const fs = __importStar(require("node:fs"));
const path = __importStar(require("node:path"));
const hash_1 = require("./hash");
const sources_1 = require("./sources");
/** Short human label per kind. Every report reads it, so there is one spelling. */
exports.STALE_LABEL = {
    code_missing: 'code gone',
    entry_lost: 'entry lost',
    test_missing: 'evidence gone',
    unmeasured: 'not measured',
    stale: 'description older than code',
};
/** Which kinds a re-stamp actually resolves. The rest need a person. */
exports.FIXED_BY_SYNC = new Set(['unmeasured', 'stale']);
function computeStaleness(repo, model) {
    const items = [];
    // One read per file for the whole run: several features routinely claim one file, and each
    // would otherwise re-read and re-normalise the same bytes.
    const cache = new Map();
    let candidates = null;
    for (const f of model.features) {
        // ── Evidence, first and unconditionally ──────────────────────────────────
        //
        // ⚠️ This runs BEFORE the code checks and is not swallowed by any branch below: a feature
        // whose files are gone still needs to be told that its evidence is gone too. Folding the two
        // into one branch silences the second exactly when it matters most.
        for (const t of f.tests) {
            if (!fs.existsSync(path.join(repo, t))) {
                items.push({
                    kind: 'test_missing', feature: f.name, subject: t,
                    detail: `the test claimed as proof is gone: ${t}`,
                });
            }
        }
        const { stamp, missing } = (0, hash_1.stampFiles)(repo, f.code, cache);
        if (missing.length) {
            items.push({
                kind: 'code_missing', feature: f.name, subject: missing[0],
                detail: `${missing.length === 1 ? 'this file is' : `${missing.length} files are`} no longer in the repo: ${missing.join(', ')}`,
            });
            // No stamp can be computed, and none should be: see `stampFiles`. Freshness is unknowable
            // until the file list is corrected, so saying anything about it here would be a guess.
            continue;
        }
        // ── Is the reading entry still where it was declared? ────────────────────
        if (f.entry) {
            const declared = f.code.some((rel) => {
                const src = cache.get(path.join(repo, rel));
                return src !== undefined && (0, hash_1.declaresSymbol)(src, f.entry);
            });
            if (!declared) {
                candidates ??= (0, sources_1.trackedSources)(repo);
                const found = (0, hash_1.findSymbolIn)(repo, f.entry, candidates.filter((c) => !f.code.includes(c)));
                items.push({
                    kind: 'entry_lost', feature: f.name, subject: f.entry, foundAt: found ?? undefined,
                    detail: found
                        ? `\`${f.entry}\` is declared in none of this feature's files; found in ${found}`
                        : `\`${f.entry}\` is declared in none of this feature's files, and nowhere else either`,
                });
            }
        }
        // ── Freshness ────────────────────────────────────────────────────────────
        //
        // A feature with no body is never stamped (see `stamp.ts`), so reporting it as unmeasured
        // here would be a second finding for one state — and the quieter, less actionable of the two.
        // `no_body` already says what is wrong and what to do about it.
        if (!f.lead.trim())
            continue;
        if (!f.stamp) {
            items.push({
                kind: 'unmeasured', feature: f.name,
                detail: 'described but never fingerprinted — run `ds sync --write`',
            });
            continue;
        }
        // ⚠️ A stamp from an older dspec is NOT evidence the code changed; it was taken under a
        // different definition of the input. Reporting it as stale would fill the first report after
        // an upgrade with drift nobody caused.
        if (!(0, hash_1.isCurrentStamp)(f.stamp)) {
            items.push({
                kind: 'unmeasured', feature: f.name,
                detail: 'fingerprinted by an older dspec — re-measure with `ds sync --write`',
            });
            continue;
        }
        if (stamp && f.stamp !== stamp) {
            items.push({
                kind: 'stale', feature: f.name,
                detail: `the code changed after this was written (${f.code.length === 1 ? f.code[0] : `${f.code.length} files`})`,
            });
        }
    }
    return items;
}
/** The staleness items for one feature — what the pack prints beside it. */
function stalenessOf(items, feature) {
    return items.filter((i) => i.feature === feature.name);
}
//# sourceMappingURL=staleness.js.map