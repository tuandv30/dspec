"use strict";
// ============================================================
// Proposing a first model from the code already here
//
// ⚠️ **It proposes; it never concludes.** A directory is an observed fact; a feature is a
// judgement about what the product does. So every file this writes is PROVISIONAL and says so in
// its own frontmatter, and the body is left **empty**.
//
// ⚠️ **The empty body is the point, not an omission.** An empty body reports as `no_body`, which
// is a worklist the user can work through. A body pre-filled with a transcription of the code
// reports as complete — which is a lie, and it also buries the very list that would have told
// them what still needs writing. Drafting bodies from leading comments once produced 130
// "complete" descriptions that restated their own function signatures.
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
exports.proposeFeatures = proposeFeatures;
exports.renderProposal = renderProposal;
exports.writeProposals = writeProposals;
const fs = __importStar(require("node:fs"));
const path = __importStar(require("node:path"));
const sources_1 = require("../../code/sources");
const types_1 = require("../../model/types");
const load_1 = require("../../model/load");
const language_1 = require("../../model/language");
const text_1 = require("../../text");
const dirOf = (rel) => {
    const i = rel.lastIndexOf('/');
    return i === -1 ? '.' : rel.slice(0, i);
};
/**
 * One proposal per directory holding unclaimed source.
 *
 * A directory is the only grouping readable from a checkout without inventing intent. It is
 * almost certainly the wrong boundary — that is why the scaffolded file says so out loud, and why
 * the command that calls this puts the question to the user rather than deciding.
 */
function proposeFeatures(repo, model) {
    const claimed = (0, types_1.claims)(model.features);
    const taken = new Set(model.features.map((f) => (0, text_1.slugify)(f.name)));
    const byDir = new Map();
    for (const rel of (0, sources_1.trackedSources)(repo)) {
        if (claimed.has(rel))
            continue;
        const d = dirOf(rel);
        byDir.set(d, [...(byDir.get(d) ?? []), rel]);
    }
    const out = [];
    for (const [dir, files] of [...byDir.entries()].sort()) {
        const parts = dir === '.' ? ['core'] : dir.split('/');
        const name = (0, text_1.humanise)(parts[parts.length - 1]);
        const area = (0, text_1.humanise)(parts.length > 1 ? parts[parts.length - 2] : name);
        let slug = (0, text_1.slugify)(name);
        // A name collision is resolved by qualifying with the path, never by overwriting: two
        // features silently sharing a file is the shape that once wrote one feature's fingerprint
        // into another's file.
        if (taken.has(slug))
            slug = (0, text_1.slugify)(parts.join(' '));
        if (taken.has(slug))
            continue;
        taken.add(slug);
        out.push({ name, area, code: files.sort(), file: `${load_1.SPEC_DIR}/${load_1.FEATURES_DIR}/${slug}.md` });
    }
    return out;
}
/**
 * The scaffolded file.
 *
 * ⚠️ **Guidance lives in frontmatter comments, never in the body.** A body is rendered into the
 * index and read by every agent, so an instructional note there is billed on every call forever;
 * it would also silence `no_body`, the rule that makes this scaffold a worklist. The parser strips
 * these comments, and the first `ds sync --write` that writes a stamp removes them — which is the
 * right lifetime.
 */
function renderProposal(p) {
    return `---
name: ${p.name}
area: ${p.area}
code:
${p.code.map((c) => `  - ${c}`).join('\n')}
# entry: someFunction     # where to start reading
# uses: [Other feature]   # the features this one depends on, by name
# tests: [test/…]         # only tests you have actually READ
#
# PROVISIONAL — proposed from the directory \`${dirOf(p.code[0])}\`, which is NOT a feature.
# A feature is something a person would name. Merge, split and rename these before writing
# the body, then say what a read of the files above would NOT tell you.
# ${(0, language_1.renderLanguageBlock)('line')}
---
`;
}
/** Write proposals that do not already exist. Existing files are never touched. */
function writeProposals(repo, proposals) {
    const written = [];
    for (const p of proposals) {
        const abs = path.join(repo, p.file);
        if (fs.existsSync(abs))
            continue;
        fs.mkdirSync(path.dirname(abs), { recursive: true });
        fs.writeFileSync(abs, renderProposal(p), 'utf-8');
        written.push(p.file);
    }
    return written;
}
//# sourceMappingURL=scaffold.js.map