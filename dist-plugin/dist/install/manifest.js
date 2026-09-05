"use strict";
// ============================================================
// Manifest — `.ds/install.json`
//
// This is what turns "run `init` again" into a REAL upgrade. Without it, a second install has
// only two possible behaviours and both are wrong: overwrite everything (losing every
// customisation somebody wrote into a command or skill) or skip everything (never receiving a
// newer version).
//
// With a manifest the question becomes answerable: *is this file still exactly as we wrote it?*
// Yes ⇒ we own it, overwrite freely. No ⇒ the user edited it, keep it and say so.
//
// ⚠️ **It must be its own file, not folded into `.ds/config.json`.** `config.json` holds the
// absolute path of a binary on one machine and is therefore gitignored; the manifest describes the
// REPO and must be committed — otherwise the second person to clone sees every file as foreign.
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
exports.AGENT_KEYS = exports.MANIFEST_FILE = void 0;
exports.sha256 = sha256;
exports.readManifest = readManifest;
exports.writeManifest = writeManifest;
exports.applyFiles = applyFiles;
exports.isAgentKey = isAgentKey;
const crypto = __importStar(require("node:crypto"));
const fs = __importStar(require("node:fs"));
const path = __importStar(require("node:path"));
const load_1 = require("../model/load");
exports.MANIFEST_FILE = `${load_1.SPEC_DIR}/install.json`;
/**
 * Hash the CONTENT, never mtime or size.
 *
 * mtime changes on every checkout; sizes collide far too easily. Either would claim "the user
 * edited this" precisely when they had not, which is the fastest way for `upgrade` to lose
 * credibility and be run with `--force` forever after.
 */
function sha256(text) {
    return crypto.createHash('sha256').update(text, 'utf-8').digest('hex');
}
function manifestPath(repo) {
    return path.join(repo, ...exports.MANIFEST_FILE.split('/'));
}
function readManifest(repo) {
    let raw;
    try {
        raw = fs.readFileSync(manifestPath(repo), 'utf-8');
    }
    catch {
        return null;
    }
    try {
        const m = JSON.parse(raw);
        if (!m || typeof m !== 'object')
            return null;
        return {
            dspec: typeof m.dspec === 'string' ? m.dspec : '0.0.0',
            agents: Array.isArray(m.agents) ? m.agents.filter((a) => typeof a === 'string') : [],
            files: Array.isArray(m.files)
                ? m.files.filter((f) => !!f && typeof f === 'object' && typeof f.path === 'string')
                : [],
        };
    }
    catch {
        // A corrupt manifest ⇒ treat it as never installed. It is auxiliary memory, not user data:
        // it can be rebuilt, and throwing here would only block the very command that repairs it.
        return null;
    }
}
function writeManifest(repo, m) {
    const p = manifestPath(repo);
    fs.mkdirSync(path.dirname(p), { recursive: true });
    const sorted = {
        dspec: m.dspec,
        agents: [...m.agents].sort(),
        // Sorted so a git diff between two installs shows only what genuinely changed.
        files: [...m.files].sort((a, b) => (a.path < b.path ? -1 : a.path > b.path ? 1 : 0)),
    };
    fs.writeFileSync(p, JSON.stringify(sorted, null, 2) + '\n', 'utf-8');
}
/**
 * Write the planned files, respecting what the user has edited.
 *
 * Three branches, and the middle one is why this module exists at all:
 * - the file does not exist ⇒ `added`
 * - it exists and its sha matches the manifest ⇒ we own it ⇒ write the new version
 * - it exists and its sha DIFFERS ⇒ the user edited it ⇒ **do not touch it**, return `preserved`
 *
 * With no manifest (a first install, or one that was deleted) an existing file is assumed to be
 * the user's. Erring cautious is correct: keeping one wrongly costs a line of warning, while
 * overwriting one wrongly loses hand-written work with no backup anywhere.
 */
function applyFiles(repo, planned, prev, force = false, 
/** Compute the verdicts without touching disk — `upgrade --dry-run` goes through THIS EXACT
 *  path, so the dry run and the real run cannot disagree. */
dryRun = false) {
    const known = new Map();
    for (const e of prev?.files ?? [])
        known.set(e.path, e.sha256);
    const out = [];
    for (const f of planned) {
        const abs = path.join(repo, ...f.path.split('/'));
        const next = sha256(f.content);
        let current = null;
        try {
            current = fs.readFileSync(abs, 'utf-8');
        }
        catch {
            /* not there yet */
        }
        let verdict;
        if (current === null)
            verdict = 'added';
        else if (sha256(current) === known.get(f.path))
            verdict = current === f.content ? 'unchanged' : 'updated';
        else if (force)
            verdict = 'overwritten';
        else
            verdict = 'preserved';
        if (!dryRun && verdict !== 'preserved' && verdict !== 'unchanged') {
            fs.mkdirSync(path.dirname(abs), { recursive: true });
            fs.writeFileSync(abs, f.content, 'utf-8');
            if (f.executable) {
                try {
                    fs.chmodSync(abs, 0o755);
                }
                catch {
                    /* Windows, or a filesystem without the bit — hooks still run via `node <file>` */
                }
            }
        }
        // ⚠️ **The sha in the manifest is the sha of what the INSTALLER WROTE**, not of what is on
        // disk. Both wrong ways of recording it lead to the same outcome — a later run overwriting
        // exactly the file we just tried to protect:
        //   - record `next` (our version) ⇒ disk differs from the manifest… but next time we compare
        //     disk against the manifest, see a difference, and still keep it. Correct, but only by
        //     accident.
        //   - record the sha of the USER'S edit ⇒ next time disk MATCHES the manifest ⇒ "this file is
        //     ours" ⇒ overwrite. One `preserved` becomes data loss on the following run.
        // The correct choice is to keep the previous sha: it still describes the last version we
        // wrote, so the question "is disk still as we left it" keeps answering correctly forever.
        const recorded = verdict === 'preserved' ? known.get(f.path) ?? null : next;
        out.push({ path: f.path, verdict, agent: f.agent, sha256: recorded });
    }
    return out;
}
exports.AGENT_KEYS = ['claude'];
function isAgentKey(s) {
    return exports.AGENT_KEYS.includes(s);
}
//# sourceMappingURL=manifest.js.map