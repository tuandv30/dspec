"use strict";
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
exports.packageRoot = packageRoot;
exports.packageVersion = packageVersion;
const fs = __importStar(require("node:fs"));
const path = __importStar(require("node:path"));
/**
 * The root directory of the running DSpec — the repo checkout in development, the installed
 * plugin directory in the hands of a user.
 *
 * ⚠️ **Why not `path.join(__dirname, '..', '..', '..')`.** That chain of `..` encodes the
 * DEPTH of whichever file calls it inside `dist/` — three levels from `dist/cli/commands/`, two
 * from `dist/install/`. Every caller counting its own levels is another place that can be wrong
 * independently, and the mistake only surfaces after publishing.
 *
 * ⚠️ **Two identity files, because there are two layouts.** In this repo the root holds a
 * `package.json` named `ds`. The published plugin has no `package.json` at all — it is a plugin,
 * and it names itself in `.claude-plugin/plugin.json`. Looking only for the former is how
 * `ds version` came to report `v0.0.0` to every plugin user, and how `0.0.0` was then written
 * into their `.ds/install.json` as the version that had authored their model.
 *
 * The `name` guard on `package.json` is necessary: a repo that USES DSpec has a `package.json`
 * at its root too, and stopping at the first one found would return the user's project root.
 */
let cachedRoot = null;
let cachedVersion = null;
/**
 * Does `dir` identify itself as DSpec?
 *
 * `null` = not us. A string = us, carrying whatever version it declares (`''` when it declares
 * none — still a match, because the DIRECTORY is right even if the version is missing).
 */
function identify(dir) {
    // The plugin layout first: it is the one users actually run.
    const files = [
        path.join(dir, '.claude-plugin', 'plugin.json'),
        path.join(dir, 'package.json'),
    ];
    for (const file of files) {
        try {
            const json = JSON.parse(fs.readFileSync(file, 'utf-8'));
            if (json.name === 'ds')
                return typeof json.version === 'string' ? json.version : '';
        }
        catch {
            /* absent, unreadable, or somebody else's — keep looking */
        }
    }
    return null;
}
function locate() {
    let dir = __dirname;
    for (;;) {
        const declared = identify(dir);
        if (declared !== null)
            return { root: dir, version: declared || null };
        const up = path.dirname(dir);
        if (up === dir)
            break;
        dir = up;
    }
    // Not found: fall back to the old guess rather than throwing. Callers already handle a
    // missing directory, and an exception here would kill the whole `init` command.
    return { root: path.resolve(__dirname, '..'), version: null };
}
function packageRoot() {
    if (cachedRoot === null) {
        const found = locate();
        cachedRoot = found.root;
        cachedVersion = found.version;
    }
    return cachedRoot;
}
/**
 * The version this DSpec declares about itself.
 *
 * ⚠️ Returns `'unknown'`, never a plausible-looking `0.0.0`, when nothing declares one. A
 * version is written into the user's `install.json` as the record of what authored their model;
 * a made-up number there is worse than an admission, because it reads as an answer.
 */
function packageVersion() {
    packageRoot();
    return cachedVersion || 'unknown';
}
//# sourceMappingURL=pkgRoot.js.map