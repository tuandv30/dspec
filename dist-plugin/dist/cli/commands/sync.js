"use strict";
// ============================================================
// `ds sync` — repair the model, as often as you like
//
// It reconciles in BOTH directions and fixes what is safe to fix:
//
//   model → code   `computeStaleness`  a description naming code that moved, vanished or changed
//   code → model   `computeCoverage`   source files nothing in the model describes
//   model quality  `buildWorkList`     features with no body, artifacts that have fallen behind
//
// ⚠️ **It repairs; `ds bootstrap` creates.** This command never invents a feature. Undescribed
// code is LISTED, never scaffolded: which files deserve a feature is a judgement, and a command
// that quietly answered it would fill a curated model with directories.
//
// ⚠️ **`--write` RE-MEASURES; it does not rewrite prose.** It restores missing base files, writes
// stamps and re-renders artifacts — all mechanical and reproducible. It never edits a body to
// agree with the code and never deletes a feature: a description the code has overtaken is where
// the CODE is the unreviewed party, and silently rewriting it would discard a decision somebody
// made.
//
// ⚠️ **It exits non-zero only when asked, with `--strict`.** That flag is the CI gate and nothing
// else turns it on: a command that failed by default would make every other use of it a hazard —
// and a gate nobody opted into is one people route around.
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
exports.buildSyncReport = buildSyncReport;
exports.failures = failures;
exports.reportCoverage = reportCoverage;
exports.cmdSync = cmdSync;
const fs = __importStar(require("node:fs"));
const path = __importStar(require("node:path"));
const load_1 = require("../../model/load");
const coverage_1 = require("../../code/coverage");
const staleness_1 = require("../../code/staleness");
const lint_1 = require("../../compile/lint");
const artifacts_1 = require("../../compile/artifacts");
const lintMessage_1 = require("../lintMessage");
const worklist_1 = require("../../compile/worklist");
const renderers_1 = require("../../compile/renderers");
const repo_1 = require("../repo");
const text_1 = require("../../text");
const stamp_1 = require("./stamp");
function buildSyncReport(repo, opts = {}) {
    const { model } = (0, load_1.loadModel)(repo);
    return {
        items: (0, worklist_1.buildWorkList)(repo, model, { skipCode: opts.skipCode }),
        coverage: opts.skipCode
            ? { dirs: [], unclaimed: 0, claimed: 0, total: 0, extra: 0 }
            : (0, coverage_1.computeCoverage)(repo, model),
        restored: [],
        staleness: opts.skipCode ? [] : (0, staleness_1.computeStaleness)(repo, model),
        findings: opts.skipCode ? [] : (0, lint_1.lintRepo)(repo, model),
    };
}
/**
 * The failures a CI run should stop on — measured facts only, never an opinion.
 *
 * ⚠️ **Code without a description is NOT one of them**, and neither is a body nobody has written
 * yet. A gate that reddens on every new file teaches people to route around it, and then the model
 * rots with the gate still green. Nor is "never measured": that means nothing is known yet, and
 * failing on it would conflate *unknown* with *wrong* — the one distinction this tool exists to
 * keep.
 */
function failures(repo, report) {
    const { model } = (0, load_1.loadModel)(repo);
    return [
        ...report.findings.filter((f) => lint_1.SEVERITY[f.code] === 'error').map((f) => (0, lintMessage_1.lintLine)(f)),
        ...report.staleness.filter((s) => s.kind === 'stale').map((s) => `${s.feature} — ${s.detail}`),
        ...(0, artifacts_1.checkArtifacts)(repo, model).stale.map((a) => `${a.path} ${a.detail}`),
    ];
}
/**
 * The code→model half, rendered.
 *
 * ⚠️ It says **decide**, not **add**. Not every file deserves a feature — a helper module
 * described in the model is noise that buries the features that matter — and which of them is
 * worth writing down is exactly the judgement this command has no way to make.
 */
function reportCoverage(coverage) {
    if (!coverage.unclaimed)
        return;
    console.log(`\nCode no feature describes — ${(0, text_1.plural)(coverage.unclaimed, 'file')} in ${(0, text_1.plural)(coverage.dirs.length, 'directory', 'directories')}:`);
    for (const d of coverage.dirs) {
        console.log(`  ${d.dir}  ${d.unclaimed}/${d.total}`);
        const rest = d.unclaimed - d.shown.length;
        console.log(`    ${d.shown.map((f) => f.split('/').pop()).join(', ')}${rest > 0 ? `, +${rest} more` : ''}`);
    }
    console.log('\n  Decide which of these are real features worth describing — most are not.');
}
/**
 * Put back the files the model cannot be read without.
 *
 * ⚠️ **Only ones that are ABSENT.** A file the user has written is never touched, whatever it
 * says — repairing a model must not mean overwriting the part of it somebody cared about.
 */
function restoreMissing(repo) {
    const root = path.join(repo, load_1.SPEC_DIR);
    const restored = [];
    const put = (rel, body) => {
        const abs = path.join(root, rel);
        if (fs.existsSync(abs))
            return;
        fs.mkdirSync(path.dirname(abs), { recursive: true });
        fs.writeFileSync(abs, body, 'utf-8');
        restored.push(`${load_1.SPEC_DIR}/${rel}`);
    };
    put(load_1.PRODUCT_FILE, `---\nname: ${path.basename(path.resolve(repo))}\n---\n\n<!-- What this product is, and who it is for. -->\n`);
    put(load_1.GLOSSARY_FILE, '# Glossary\n\n<!-- What the words mean HERE. -->\n');
    fs.mkdirSync(path.join(root, load_1.FEATURES_DIR), { recursive: true });
    return restored;
}
function cmdSync(args) {
    const write = args.includes('--write');
    const json = args.includes('--json');
    const brief = args.includes('--brief');
    // ⚠️ **The only way this command exits non-zero**, and it is opt-in. A pipeline chooses its own
    // strictness; a command that failed by default would make every other use of it a hazard.
    const strict = args.includes('--strict');
    const repo = (0, repo_1.findRepo)();
    if (!(0, load_1.hasModel)(repo)) {
        // Repairing nothing is not a repair. Say which command creates a model rather than quietly
        // creating one — the two are different intentions and the user gets to pick.
        console.error(`✗ no \`${load_1.SPEC_DIR}/\` here — run \`ds bootstrap\` to create the model first`);
        return 2;
    }
    const restored = [];
    if (write) {
        restored.push(...restoreMissing(repo));
        // Order matters: stamp first, render second. Rendering before stamping would stamp an
        // artifact from values that are about to change.
        const loaded = (0, load_1.loadModel)(repo);
        const stamps = (0, stamp_1.writeStamps)(repo, loaded.model, loaded.sourceOf, true);
        const fresh = (0, load_1.loadModel)(repo).model;
        for (const file of (0, renderers_1.renderAll)(fresh, { projectId: fresh.product.name, generatedAt: new Date().toISOString() })) {
            const abs = path.join(repo, file.file);
            fs.mkdirSync(path.dirname(abs), { recursive: true });
            fs.writeFileSync(abs, file.content, 'utf-8');
        }
        for (const r of restored)
            console.log(`✓ restored ${r}`);
        if (stamps.updated.length)
            console.log(`✓ stamped ${(0, text_1.plural)(stamps.updated.length, 'feature')}`);
        for (const s of stamps.skipped)
            console.log(`! ${s}`);
    }
    // Built AFTER the writes, so what is reported is the state the user is left in — not the one
    // they arrived with.
    const report = buildSyncReport(repo, { skipCode: brief });
    report.restored = restored;
    if (json) {
        console.log(JSON.stringify(report, null, 2));
        return strict && failures(repo, report).length ? 1 : 0;
    }
    if (brief) {
        // The session hook's view: short, and only what can be acted on after reading.
        for (const i of report.items.slice(0, 8))
            console.log(`- ${i.title}${i.next ? ` → ${i.next}` : ''}`);
        if (report.items.length > 8)
            console.log(`- … +${report.items.length - 8} more (ds sync)`);
        return 0;
    }
    if (!report.items.length && !report.coverage.unclaimed) {
        console.log('✓ the model and the code agree');
        return 0;
    }
    for (const i of report.items) {
        console.log(`- ${i.title}`);
        if (i.detail)
            console.log(`    ${i.detail}`);
        if (i.next)
            console.log(`    → ${i.next}`);
    }
    for (const f of report.findings.filter((x) => lint_1.SEVERITY[x.code] !== 'info')) {
        console.log(`${lintMessage_1.MARK[f.severity]} ${(0, lintMessage_1.lintLine)(f)}`);
    }
    reportCoverage(report.coverage);
    if (!write)
        console.log('\n(dry run — add `--write` to restore, stamp and render)');
    if (strict) {
        const failed = failures(repo, report);
        if (failed.length) {
            console.log(`\n✗ ${(0, text_1.plural)(failed.length, 'failure')} — the model and the code disagree about something measurable`);
            return 1;
        }
    }
    return 0;
}
//# sourceMappingURL=sync.js.map