"use strict";
// ============================================================
// `.ds/` → Model
//
// Four file kinds, and only one of them is authored prose. The path of a feature file carries NO
// meaning: subfolders under `features/` are a human convenience and are walked recursively, so a
// model can be reorganised on disk without changing a single thing about what it says. That is the
// deliberate: a layout that carries meaning forces a filing decision a feature can outgrow.
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
exports.INDEX_FILE = exports.GLOSSARY_FILE = exports.PRODUCT_FILE = exports.FEATURES_DIR = exports.SPEC_DIR = void 0;
exports.loadModel = loadModel;
exports.hasModel = hasModel;
const fs = __importStar(require("node:fs"));
const path = __importStar(require("node:path"));
const frontmatter_1 = require("./frontmatter");
const sections_1 = require("./sections");
exports.SPEC_DIR = '.ds';
exports.FEATURES_DIR = 'features';
exports.PRODUCT_FILE = 'product.md';
exports.GLOSSARY_FILE = 'glossary.md';
exports.INDEX_FILE = 'index.md';
// ─── Reading YAML values defensively ────────────────────────────────────────
//
// Frontmatter is typed by humans and agents, so wrong shapes are ordinary. A wrong type means
// SKIP THAT VALUE, never throw: one malformed file must not destroy the very report that would
// tell the user where they mistyped. Syntax errors are a different matter — those throw in
// `yaml.ts`, because a `code:` list that silently vanishes takes a feature out of every check.
const str = (v) => typeof v === 'string' ? v.trim()
    : typeof v === 'number' || typeof v === 'boolean' ? String(v)
        : '';
/** Accepts both `a` and `[a, b]` — a single-entry list written bare is the commonest shape. */
function strList(v) {
    if (typeof v === 'string')
        return v.trim() ? [v.trim()] : [];
    if (!Array.isArray(v))
        return [];
    return v.filter((x) => typeof x === 'string' && x.trim() !== '').map((s) => s.trim());
}
/**
 * `place-order.md` → `Place order`, for a file whose frontmatter declares no `name`.
 *
 * It deliberately does not guess mid-sentence capitalisation: guessing one capital wrong produces
 * two labels for one feature, and `uses` would resolve against neither.
 */
function nameFromFile(file) {
    const base = path.basename(file, '.md').replace(/^_/, '');
    const words = base.replace(/[-_]+/g, ' ').trim();
    return words ? words[0].toUpperCase() + words.slice(1) : base;
}
/** Every `.md` under a directory, recursively, sorted — dotfiles and dot-directories skipped. */
function listMdDeep(dir, rel = '') {
    if (!fs.existsSync(dir))
        return [];
    const out = [];
    for (const e of fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
        if (e.name.startsWith('.'))
            continue;
        const child = path.join(dir, e.name);
        const childRel = rel ? `${rel}/${e.name}` : e.name;
        if (e.isDirectory())
            out.push(...listMdDeep(child, childRel));
        else if (e.name.endsWith('.md'))
            out.push(childRel);
    }
    return out;
}
// ─── The kinds ──────────────────────────────────────────────────────────────
function loadProduct(root) {
    const file = path.join(root, exports.PRODUCT_FILE);
    if (!fs.existsSync(file))
        return { name: '', vision: '', rules: [] };
    const doc = (0, frontmatter_1.parseDoc)(fs.readFileSync(file, 'utf-8'), `${exports.SPEC_DIR}/${exports.PRODUCT_FILE}`);
    const body = (0, sections_1.parseBody)(doc.body);
    return { name: str(doc.meta.name), vision: body.lead, rules: (0, sections_1.section)(body, 'Rules') };
}
function loadFeature(abs, rel) {
    const doc = (0, frontmatter_1.parseDoc)(fs.readFileSync(abs, 'utf-8'), rel);
    const body = (0, sections_1.parseBody)(doc.body);
    return {
        name: str(doc.meta.name) || nameFromFile(rel),
        area: str(doc.meta.area),
        code: strList(doc.meta.code),
        entry: str(doc.meta.entry) || undefined,
        uses: strList(doc.meta.uses),
        tests: strList(doc.meta.tests),
        stamp: str(doc.meta.stamp) || undefined,
        lead: body.lead,
        rules: (0, sections_1.section)(body, 'Rules'),
        behaviour: (0, sections_1.section)(body, 'Behaviour'),
        body: doc.body,
    };
}
/**
 * Load the whole model from `<repo>/.ds/`.
 *
 * `repo` is the repo root, not the `.ds` directory — so every path this returns is relative to the
 * repo root, the same form `code:` uses, and the two can be compared without any caller having to
 * normalise them.
 */
function loadModel(repo) {
    const root = path.join(repo, exports.SPEC_DIR);
    if (!fs.existsSync(root)) {
        throw new Error(`no \`${exports.SPEC_DIR}/\` found in ${repo} — run \`ds sync --write\` to scaffold one`);
    }
    const sourceOf = new Map();
    const features = [];
    const base = path.join(root, exports.FEATURES_DIR);
    for (const relInDir of listMdDeep(base)) {
        const rel = `${exports.SPEC_DIR}/${exports.FEATURES_DIR}/${relInDir}`;
        const feature = loadFeature(path.join(base, relInDir), rel);
        features.push(feature);
        sourceOf.set(feature, rel);
    }
    const glossaryFile = path.join(root, exports.GLOSSARY_FILE);
    const model = {
        product: loadProduct(root),
        glossary: fs.existsSync(glossaryFile) ? fs.readFileSync(glossaryFile, 'utf-8').trim() : '',
        features,
    };
    if (!model.product.name)
        model.product.name = path.basename(path.resolve(repo));
    return { model, sourceOf };
}
/** Does this repo hold a model at all? Asked before every command that reads one. */
function hasModel(repo) {
    return fs.existsSync(path.join(repo, exports.SPEC_DIR));
}
//# sourceMappingURL=load.js.map