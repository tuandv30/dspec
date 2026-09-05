"use strict";
// ============================================================
// dspec-lang — **one single source**
//
// The keys, the labels, the glosses and the worked example are declared HERE, and every other
// surface that teaches an agent to write is generated from this file: the seeded `.ds/README`,
// the slash commands, the skill, and the reference table in the docs.
//
// ⚠️ **This is not a style choice; it is the fix for a measured failure.** The label set was once
// hand-written in seven places — seven copies of a vocabulary the linter penalises against, so six
// of them could drift, and a user who read a drifted copy was penalised for following the
// documentation. `test/model/language.test.js` fails any surface that spells the vocabulary out
// instead of using a `__DS_LANG_*__` placeholder.
//
// ⚠️ **The keys and labels are always English.** They are not interface text but PARSED
// VOCABULARY: recognition lowercases a line and compares it against this set, so translating one
// would change the syntax of the language and every existing model would stop parsing.
// ============================================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.LEAD_GLOSS = exports.LABELS = exports.BODY_LABELS = exports.KEYS = exports.FEATURE_KEYS = void 0;
exports.labelLine = labelLine;
exports.requiredKeyLine = requiredKeyLine;
exports.exampleFeature = exampleFeature;
exports.renderLanguageBlock = renderLanguageBlock;
/**
 * The frontmatter keys of a feature file, in the order they should be written.
 *
 * Changing this changes the language: the loader, the linter, the scaffolder and every generated
 * document read from here, so they can no longer disagree.
 */
exports.FEATURE_KEYS = ['name', 'area', 'code', 'entry', 'uses', 'tests', 'stamp'];
exports.KEYS = [
    {
        name: 'name',
        required: true,
        writer: 'you',
        gloss: 'How this feature is addressed. Unique across the model — `uses` resolves against it.',
    },
    {
        name: 'area',
        required: true,
        writer: 'you',
        gloss: 'A label that groups the index. Free text, and NOT a boundary: nothing is filed inside an area.',
    },
    {
        name: 'code',
        required: true,
        writer: 'you',
        gloss: 'Every file this feature lives in, repo-relative. This is the answer to "where is it".',
    },
    {
        name: 'entry',
        required: false,
        writer: 'you',
        gloss: 'Where to start reading — a symbol declared in one of the `code` files.',
    },
    {
        name: 'uses',
        required: false,
        writer: 'you',
        gloss: 'The features this one depends on, by name. These are the only edges in the model.',
    },
    {
        name: 'tests',
        required: false,
        writer: 'you',
        gloss: 'Tests you have actually read that prove what this file describes. Never guessed from a filename.',
    },
    {
        name: 'stamp',
        required: false,
        writer: 'cli',
        gloss: 'Fingerprint of the `code` files. Written by `ds sync` — never type it.',
    },
];
/**
 * The labels of a feature body, in recommended order.
 *
 * Two, down from five. `Input`, `Errors` and `Effects` were symbol-level concerns: at the level of
 * a feature they belong inside `Behaviour`, and asking a writer to classify a sentence into five
 * buckets bought nothing the reader could use.
 */
exports.BODY_LABELS = ['Rules', 'Behaviour'];
exports.LABELS = [
    {
        name: 'Rules',
        gloss: 'Invariants that must hold — the things a change must not break, and why.',
        example: '- Drift is reported, never auto-fixed: the code is the unreviewed party.',
    },
    {
        name: 'Behaviour',
        gloss: 'What it does, and the cases that matter: order, precedence, what it refuses.',
        example: '- Evidence is checked first, so a lost test is reported even when the file is gone too.',
    },
];
/** The lead paragraph carries no label. Named here so generated docs describe it consistently. */
exports.LEAD_GLOSS = 'The prose before the first label: what this feature IS, in product terms. One paragraph.';
const FILTER_RULE = 'The filter that decides what goes in: **if one read of the files in `code` would tell you, it ' +
    'is not worth a line.** Write what that read would NOT tell you — why a branch exists, which ' +
    'failure it prevents, what must never change.';
const DECLARED_RULE = '`code` and `uses` are **declared, never inferred**. Nothing is guessed from imports, from ' +
    'naming, or from word overlap: a tool that guesses a file list will one day omit the file that ' +
    'mattered, and present the omission as scope. `ds sync` verifies every path and every name.';
/** The labels joined by ` · ` — the shortest form, usable inside a sentence. */
function labelLine() {
    return exports.BODY_LABELS.map((s) => `\`${s}\``).join(' · ');
}
/** The required keys joined by ` · `. */
function requiredKeyLine() {
    return exports.KEYS.filter((k) => k.required).map((k) => `\`${k.name}\``).join(' · ');
}
/** A worked feature file built FROM the declarations, so it can never drift from them. */
function exampleFeature() {
    return [
        '---',
        'name: Drift detection',
        'area: Code measurement',
        'code:',
        '  - src/code/drift.ts',
        '  - src/cli/commands/drift.ts',
        'entry: computeDrift',
        'uses: [Code fingerprint, Model loading]',
        'tests: [test/reconcile/drift.test.js]',
        '---',
        '',
        'Answers the question a file path cannot: is this description still true of the code it points',
        'at. Every answer is measured by re-reading the checkout, never by remembering.',
        '',
        ...exports.LABELS.flatMap((l) => [l.name, l.example, '']),
    ].join('\n').trimEnd();
}
function keyTable() {
    const rows = exports.KEYS.map((k) => `| \`${k.name}\` | ${k.required ? '✅' : ''} | ${k.writer === 'cli' ? '**the CLI**' : 'you'} | ${k.gloss} |`);
    return ['| Key | Required | Written by | Meaning |', '|---|---|---|---|', ...rows].join('\n');
}
function labelTable() {
    const rows = exports.LABELS.map((l) => `| \`${l.name}\` | ${l.gloss} |`);
    return [
        '| Label | What goes under it |',
        '|---|---|',
        `| *(lead paragraph)* | ${exports.LEAD_GLOSS} |`,
        ...rows,
    ].join('\n');
}
function renderLanguageBlock(depth) {
    if (depth === 'line') {
        return (`A feature file declares ${requiredKeyLine()} in its frontmatter, and its body is a lead ` +
            `paragraph plus the fixed labels ${labelLine()} — nothing else.`);
    }
    const tables = [keyTable(), '', labelTable()].join('\n');
    if (depth === 'table')
        return tables;
    return [
        tables,
        '',
        FILTER_RULE,
        '',
        DECLARED_RULE,
        '',
        'A feature file:',
        '',
        '```markdown',
        exampleFeature(),
        '```',
    ].join('\n');
}
//# sourceMappingURL=language.js.map