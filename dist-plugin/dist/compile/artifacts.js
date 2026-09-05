"use strict";
// ============================================================
// Has a rendered artifact fallen behind the model?
//
// ⚠️ **Answered by RE-RENDERING AND COMPARING CONTENT, never by a version number.** A number in a
// file is a claim the file makes about itself, and a hand-edited file still carries the old one.
// Re-rendering is the only check that cannot be fooled by the thing it is checking.
//
// ⚠️ **Every format, not just the root file.** The index is the entry point; a stale index sends
// every reader to the wrong place while `CLAUDE.md` looks perfectly current.
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
exports.checkArtifacts = checkArtifacts;
const fs = __importStar(require("node:fs"));
const path = __importStar(require("node:path"));
const renderers_1 = require("./renderers");
function checkArtifacts(repo, model) {
    const stale = [];
    const unstamped = [];
    // The timestamp is what a caller would vary; freshness must not depend on it, so a fixed value
    // goes in and `withoutTimestamp` takes it out of both sides of the comparison.
    const fresh = (0, renderers_1.renderAll)(model, { projectId: model.product.name, generatedAt: '' });
    for (const file of fresh) {
        const abs = path.join(repo, file.file);
        if (!fs.existsSync(abs)) {
            stale.push({ path: file.file, reason: 'missing', detail: 'has never been rendered — run `ds sync --write`' });
            continue;
        }
        const onDisk = fs.readFileSync(abs, 'utf-8');
        const parsed = (0, renderers_1.parseArtifactStamp)(onDisk);
        if (!parsed) {
            // ⚠️ Reported, never overwritten by the check. These names belong to dspec, so finding one
            // it does not manage is worth saying exactly once — and saying it is all this may do.
            unstamped.push(file.file);
            continue;
        }
        if (parsed.projectId !== model.product.name) {
            stale.push({
                path: file.file,
                reason: 'foreign',
                detail: `generated from a different project (\`${parsed.projectId}\`) — copied in from another repo?`,
            });
            continue;
        }
        if ((0, renderers_1.withoutTimestamp)(onDisk).trim() !== (0, renderers_1.withoutTimestamp)(file.content).trim()) {
            stale.push({ path: file.file, reason: 'behind', detail: 'has fallen behind the model — run `ds sync --write`' });
        }
    }
    return { stale, unstamped };
}
//# sourceMappingURL=artifacts.js.map