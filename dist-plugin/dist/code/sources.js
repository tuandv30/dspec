"use strict";
// ============================================================
// Which files count as this product's source
//
// The denominator of coverage, and the candidate set when hunting for an entry symbol that moved.
// It is git's answer, filtered — never a directory walk, because an untracked build output or a
// vendored dependency would otherwise be reported as code nobody described, and a report full of
// things the user never wrote is a report the user stops reading.
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
exports.isSourceFile = isSourceFile;
exports.trackedSources = trackedSources;
const fs = __importStar(require("node:fs"));
const path = __importStar(require("node:path"));
const rev_1 = require("../git/rev");
/** Extensions that carry behaviour. Markdown, JSON and config are described by the files that use them. */
const SOURCE_EXT = /\.(ts|tsx|js|jsx|mjs|cjs|py|go|rs|java|kt|rb|php|cs|swift|scala)$/;
const GENERATED_DIRS = new Set(['dist', 'build', 'out', 'coverage', 'target', '.next', '.nuxt', '.output']);
/**
 * Directories holding tests or their helpers.
 *
 * ⚠️ **A path segment, not a filename pattern.** `TEST_FILE` below catches `foo.test.ts` but not
 * `test/support/repo.js` or `test/fixtures/model.js` — helpers that are unmistakably test material
 * and were being reported as production code nobody had described. Asking a user to write a
 * feature about their own test fixtures is how a coverage report loses its reader.
 */
const TEST_DIRS = new Set(['test', 'tests', '__tests__', 'spec', 'specs', 'e2e', 'fixtures']);
/** `dist`, and also `dist-plugin`: a build output does not stop being one for having a suffix. */
const isGeneratedSegment = (seg) => GENERATED_DIRS.has(seg) || seg.startsWith('dist-');
/**
 * A test file, by the naming conventions common across the languages above:
 * `*.spec.ts` / `*.test.js`, `*_test.go`, `*_spec.rb`, `test_*.py`.
 *
 * Excluded for the same reason as a build directory: a feature's `code:` describes production
 * behaviour and names its tests in `tests:` instead, so counting a spec file as undescribed source
 * would ask the user to write a feature about their own test suite.
 */
const TEST_FILE = /(\.(spec|test)\.[a-z0-9]+$)|(_(test|spec)\.[a-z0-9]+$)|((^|\/)test_[^/]+\.py$)/i;
/** Is this path one the model is expected to account for? Exactly one place decides. */
function isSourceFile(rel) {
    if (!SOURCE_EXT.test(rel))
        return false;
    const segments = rel.split('/').slice(0, -1);
    if (segments.some(isGeneratedSegment))
        return false;
    if (segments.some((seg) => TEST_DIRS.has(seg)))
        return false;
    return !TEST_FILE.test(rel);
}
/**
 * Every source file git tracks.
 *
 * ⚠️ Returns `[]` rather than throwing when this is not a git checkout. Coverage then reports
 * nothing, which is the honest answer — "I cannot see your files" must not render as "every file
 * is described".
 */
function trackedSources(repo) {
    const out = (0, rev_1.gitOut)(repo, ['ls-files']);
    if (out === null)
        return [];
    // ⚠️ Tracked is not the same as present. A file deleted but not yet committed is still in the
    // index, and reporting it as source nobody describes asks the user to write a feature about a
    // file they just removed.
    return out
        .split('\n')
        .filter((f) => f && isSourceFile(f) && fs.existsSync(path.join(repo, f)));
}
//# sourceMappingURL=sources.js.map