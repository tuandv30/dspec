"use strict";
// ============================================================
// `ds version` — what is installed, and can it run?
//
// The version leads because it is the question actually being asked; the checks follow because
// they are the reason the answer might not be the one the user expects.
//
// **The boundary with `sync`.** `ds sync` answers "where do the model and the code disagree".
// This answers "is the INSTALLATION sound" — which dspec, what Node, does this project declare
// the plugin. The two do not overlap, and this **must never call `buildWorkList`**: repeating the
// other command's output teaches people to ignore one of them.
//
// ⚠️ **It reports only what is INSTALLED — never what is latest.** Finding that out means a
// network call, and dspec makes none: that is a product rule, not an oversight. Taking a new
// release is Claude Code's job through its own plugin protocol, and `/ds:update` is where the
// user is sent for it.
//
// **Always exits 0.** This is a diagnostic, not a gate. The only thing it is entitled to do is
// say what it sees.
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
exports.cmdVersion = cmdVersion;
const fs = __importStar(require("node:fs"));
const path = __importStar(require("node:path"));
const node_child_process_1 = require("node:child_process");
const load_1 = require("../../model/load");
const repo_1 = require("../repo");
const args_1 = require("../args");
const pkgRoot_1 = require("../../pkgRoot");
const manifest_1 = require("../../install/manifest");
const text_1 = require("../../text");
const project_1 = require("../../install/project");
const MARK = { ok: '✓', warn: '!', info: '·' };
const USAGE = `ds version [--json]

  Which dspec is installed, and whether it can run: Node, git, the plugin declaration, the model.
  Always exits 0.

  It never reports what the LATEST version is — that needs a network call, and dspec makes none.
  Run \`/ds:update\` to take a newer release.
  Where the model and the code disagree is the job of \`ds sync\`.`;
function cmdVersion(argv) {
    const { values } = (0, args_1.parseFlags)(argv, {
        json: { type: 'boolean' },
        help: { type: 'boolean', short: 'h' },
    });
    if (values.help) {
        console.log(USAGE);
        return 0;
    }
    const repo = (0, repo_1.findRepo)();
    const out = [];
    // ---- environment -----------------------------------------------------
    //
    // ⚠️ This is a VERSION check, not a PRESENCE check, and it cannot be otherwise: the number it
    // reads is the version of the Node already running this process. A missing Node cannot be
    // reported here because a missing Node means `doctor` never started — every command and hook
    // is `node "${CLAUDE_PLUGIN_ROOT}/…"`. The symptom is silence, and the place it is diagnosed
    // is the troubleshooting table, not here.
    const major = Number(process.versions.node.split('.')[0]);
    out.push(major >= 20
        ? { level: 'ok', label: 'node', detail: `v${process.versions.node}` }
        : { level: 'warn', label: 'node', detail: `v${process.versions.node} — dspec needs ≥ 20`, fix: 'upgrade Node to an LTS release' });
    let gitVersion = '';
    try {
        gitVersion = (0, node_child_process_1.execFileSync)('git', ['--version'], { encoding: 'utf-8' }).trim();
    }
    catch {
        /* no git */
    }
    out.push(gitVersion
        ? { level: 'ok', label: 'git', detail: gitVersion }
        : { level: 'warn', label: 'git', detail: 'not on PATH — dspec reads `git ls-files` to know which source files exist' });
    // ⚠️ The PATH matters as much as the number. A plugin is cached under
    // `~/.claude/plugins/cache/<marketplace>/<plugin>/<version>/`, so this is how somebody
    // reporting a bug tells us WHICH copy answered — the installed plugin, or a checkout they are
    // hacking on. Two dspecs on one machine answering differently is otherwise unexplainable.
    out.push({ level: 'info', label: 'installed at', detail: (0, pkgRoot_1.packageRoot)() });
    // ---- repo ------------------------------------------------------------
    const root = path.join(repo, load_1.SPEC_DIR);
    if (!fs.existsSync(root)) {
        out.push({ level: 'warn', label: 'model', detail: `no ${load_1.SPEC_DIR}/ in ${repo}`, fix: 'ds bootstrap --here' });
        return report(out, values.json, repo);
    }
    out.push({ level: 'ok', label: 'model', detail: `${load_1.SPEC_DIR}/ at ${repo}` });
    // ---- the plugin declaration ------------------------------------------
    //
    // This is what makes a teammate's checkout work. `extraKnownMarketplaces` says where dspec
    // comes from and `enabledPlugins` says this project uses it; without both, cloning the repo
    // gets the model and none of the loop, and nothing anywhere says why.
    const decl = (0, project_1.readDeclaration)(repo);
    if (!decl.marketplace) {
        out.push({
            level: 'warn',
            label: 'plugin',
            detail: `.claude/settings.json does not declare the \`${project_1.MARKETPLACE.name}\` marketplace — a teammate cloning this repo gets no loop`,
            fix: 'ds bootstrap --here',
        });
    }
    else if (decl.enabled === null) {
        out.push({ level: 'warn', label: 'plugin', detail: `the marketplace is declared but \`${project_1.PLUGIN_ID}\` is not in enabledPlugins`, fix: 'ds bootstrap --here' });
    }
    else if (!decl.enabled) {
        // Deliberately turned off. Say it and move on — `init` will not flip it back.
        out.push({ level: 'info', label: 'plugin', detail: `\`${project_1.PLUGIN_ID}\` is declared but switched OFF in this project` });
    }
    else {
        // The ref is reported because it is the difference between "I am on the release channel" and
        // "I am frozen on a version" — and a frozen install that nobody remembers freezing looks
        // exactly like a broken update.
        const ref = decl.ref ?? '(default branch)';
        out.push({ level: 'ok', label: 'plugin', detail: `${project_1.PLUGIN_ID} · from ${project_1.MARKETPLACE.repo}@${ref}` });
    }
    // ---- manifest --------------------------------------------------------
    //
    // `install.json` no longer tracks installed files — the plugin owns those, and dspec writes
    // nothing outside `.ds/`. What is left is the one fact worth keeping: WHICH dspec wrote
    // this model. It is the first question behind every "why does my model look odd" report.
    const manifest = (0, manifest_1.readManifest)(repo);
    if (!manifest) {
        out.push({ level: 'info', label: 'manifest', detail: `no ${manifest_1.MANIFEST_FILE} — written by \`ds bootstrap\``, fix: 'ds bootstrap --here' });
    }
    else {
        const stale = manifest.files.length;
        out.push({
            level: 'ok',
            label: 'manifest',
            detail: `written by dspec ${manifest.dspec}`
                + (stale ? ` · ${(0, text_1.plural)(stale, 'file')} recorded by an older version, no longer managed` : ''),
        });
    }
    return report(out, values.json, repo);
}
function report(out, json, repo) {
    if (json) {
        console.log(JSON.stringify({ version: (0, pkgRoot_1.packageVersion)(), root: (0, pkgRoot_1.packageRoot)(), repo, findings: out }, null, 2));
        return 0;
    }
    // The headline first: it is the question the command was asked. Everything below explains why
    // that version might not be behaving as expected.
    console.log(`\ndspec ${(0, pkgRoot_1.packageVersion)()}\n`);
    for (const f of out) {
        console.log(`  ${MARK[f.level]} ${f.label.padEnd(15)} ${f.detail}`);
        if (f.fix && f.level === 'warn')
            console.log(`  ${' '.repeat(17)}→ ${f.fix}`);
    }
    const warns = out.filter((f) => f.level === 'warn').length;
    // Exits 0 even with warnings — see the file header. Only the summary line changes.
    console.log(warns
        ? `\n${(0, text_1.plural)(warns, 'thing')} to look at — none of them blocks anything.`
        : '\nHealthy. Run `/ds:update` to check for a newer release.');
    return 0;
}
//# sourceMappingURL=version.js.map