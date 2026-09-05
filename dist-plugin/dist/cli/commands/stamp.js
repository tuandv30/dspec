"use strict";
// ============================================================
// Writing the one field the CLI owns
//
// ⚠️ **`stamp` and nothing else.** Everything a person wrote stays exactly as they wrote it. The
// CLI re-measures; only a person may re-decide. In particular this never writes `tests:` —
// guessing that `drift.ts` is proven by `drift.test.js` turns *"nobody proved this"* into *"this
// is proven"*, the dangerous direction, and it fails silently because the warning switches off
// exactly when it is most needed.
//
// ⚠️ Rewriting frontmatter drops `#` comments, because the serialiser is the inverse of the
// parser and the parser strips them. That is the intended lifetime for a scaffolding note: it is
// there while the feature is unwritten, and gone once it has been measured.
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
exports.writeStamps = writeStamps;
const fs = __importStar(require("node:fs"));
const path = __importStar(require("node:path"));
const frontmatter_1 = require("../../model/frontmatter");
const hash_1 = require("../../code/hash");
function writeStamps(repo, model, sourceOf, write) {
    const report = { updated: [], unchanged: 0, skipped: [] };
    // One read per file for the whole run: several features routinely claim one file.
    const cache = new Map();
    for (const feature of model.features) {
        if (!feature.code.length)
            continue;
        // ⚠️ **A feature with no body is not stamped.** A stamp asserts "this description is current
        // for this code", and a description that says nothing cannot be current — stamping it would
        // make an empty file report as measured and fine, which is the "unmeasured must never look
        // fine" rule turned exactly inside out.
        //
        // It also gives the scaffolding comments a life. They are stripped whenever frontmatter is
        // rewritten, so stamping a freshly scaffolded feature in the same run erased the guidance
        // before the user ever opened the file.
        if (!feature.lead.trim())
            continue;
        const { stamp, missing } = (0, hash_1.stampFiles)(repo, feature.code, cache);
        if (!stamp) {
            report.skipped.push(`${feature.name}: ${missing.length ? `${missing.join(', ')} not on disk` : 'nothing to fingerprint'}`);
            continue;
        }
        if (feature.stamp === stamp) {
            report.unchanged++;
            continue;
        }
        const rel = sourceOf.get(feature);
        if (!rel)
            continue;
        const abs = path.join(repo, rel);
        const doc = (0, frontmatter_1.parseDoc)(fs.readFileSync(abs, 'utf-8'), rel);
        doc.meta.stamp = stamp;
        if (write)
            fs.writeFileSync(abs, (0, frontmatter_1.renderDoc)(doc), 'utf-8');
        report.updated.push(rel);
    }
    return report;
}
//# sourceMappingURL=stamp.js.map