"use strict";
// ============================================================
// Asking the user things — and the rule that governs all of it
//
// ⚠️ **Never ask when asking is not allowed.** An `npx ds init` that hangs in CI waiting for
// a keypress is a far worse failure than a skipped question: it reports nothing and times out
// ten minutes later. `--yes` and a non-TTY stdin are both checked by the caller, and `confirm`
// is only reached when neither applies.
//
// The multi-select agent picker that used to live here is gone with Cursor and Copilot: there is
// one install target, so there is nothing to pick. See `install/agents.ts`.
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
exports.canPrompt = canPrompt;
exports.confirm = confirm;
const readline = __importStar(require("node:readline/promises"));
/** Are we allowed to open an interactive prompt? */
function canPrompt(input = process.stdin) {
    return Boolean(input.isTTY);
}
/**
 * A one-line yes/no question.
 *
 * Only called when `canPrompt()` — for the reason at the top of this file. An empty Enter takes
 * `def`, so a terminal that returns EOF immediately still does not hang.
 */
async function confirm(question, def, opts = {}) {
    const rl = readline.createInterface({ input: opts.input ?? process.stdin, output: opts.output ?? process.stdout });
    try {
        const answer = (await rl.question(`${question} ${def ? '[Y/n]' : '[y/N]'} `)).trim().toLowerCase();
        if (!answer)
            return def;
        return answer === 'y' || answer === 'yes';
    }
    finally {
        rl.close();
    }
}
//# sourceMappingURL=prompt.js.map