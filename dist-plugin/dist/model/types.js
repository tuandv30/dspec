"use strict";
// ============================================================
// The read model — what `.ds/` becomes once it is loaded
//
// One structure, read by every other layer: the linter, the renderers, the pack, the coverage
// walk. It is deliberately small. dspec-lang has one authored element — the feature — so this
// file has one interesting type, and everything else is the product wrapper around it.
// ============================================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.normName = void 0;
exports.summaryOf = summaryOf;
exports.byArea = byArea;
exports.findFeature = findFeature;
exports.claims = claims;
/** The first sentence of the lead — what the index prints. Derived, never stored. */
function summaryOf(f) {
    const lead = f.lead.replace(/\s+/g, ' ').trim();
    if (!lead)
        return '';
    const m = /^.*?\.( |$)/.exec(lead);
    let first = (m ? m[0] : lead).trim().replace(/\.$/, '');
    // A lead whose first sentence runs on is trimmed at a word boundary rather than mid-word: the
    // index is read at a glance, and a line that wraps three times is a line nobody reads.
    if (first.length > 170)
        first = first.slice(0, 170).replace(/\s+\S*$/, '') + '…';
    return first;
}
/** Features grouped by `area`, each group sorted by name. Insertion order of areas is preserved. */
function byArea(features) {
    const out = new Map();
    for (const f of features) {
        const list = out.get(f.area);
        if (list)
            list.push(f);
        else
            out.set(f.area, [f]);
    }
    for (const list of out.values())
        list.sort((a, b) => a.name.localeCompare(b.name));
    return out;
}
/** Case- and whitespace-insensitive lookup key. One definition, used by every resolver. */
const normName = (s) => s.toLowerCase().trim().replace(/\s+/g, ' ');
exports.normName = normName;
/** Find a feature by name. `uses` and `ds spec` must resolve identically, so both ask here. */
function findFeature(model, name) {
    const want = (0, exports.normName)(name);
    return model.features.find((f) => (0, exports.normName)(f.name) === want);
}
/** Every file claimed by any feature → the features claiming it. */
function claims(features) {
    const out = new Map();
    for (const f of features) {
        for (const p of f.code) {
            const list = out.get(p);
            if (list)
                list.push(f);
            else
                out.set(p, [f]);
        }
    }
    return out;
}
//# sourceMappingURL=types.js.map