"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VERBS = void 0;
exports.main = main;
/**
 * dspec CLI — the product model is files in the repo, and everything runs locally.
 *
 * No network configuration, no token, no background process: every command reads `.ds/` and, when
 * it matters, the actual source in the checkout. That is the deepest design choice here — the CLI
 * stands INSIDE the repo, so "is this description still true?" is a question it answers by
 * measuring rather than by trusting what an agent reports.
 *
 * ⚠️ **One flat set, and every verb is a command the user knows by name.** This listing was once
 * split into "what you type" and "what the hooks call", which invited verbs that existed only
 * because something used to call them — `init`, `drift`, `doctor`, `pack`, `whose` and `check` all
 * survived that way, each overlapping a neighbour. There is one kind of command: if a user cannot
 * name it, it is not one, and its job belongs to a flag on a command they can name.
 *
 * ⚠️ **dspec is a toolkit; the brain is the agent using it.** Every verb below either MEASURES
 * something readable from the checkout or writes something mechanical. None of them decides what
 * a feature is, which files deserve one, or whether a description is still true — those are
 * judgements, and they belong to whoever can read the code.
 */
const bootstrap_1 = require("./commands/bootstrap");
const sync_1 = require("./commands/sync");
const spec_1 = require("./commands/spec");
const version_1 = require("./commands/version");
const USAGE = `ds — dspec: the product model lives in your repo, and is measured against it

  ds bootstrap [<dir>] [--here]            create the model: .ds/, the plugin declaration, and one
                                           provisional feature per directory of source
  ds sync      [--write] [--strict]        repair an existing model: restore what is missing,
                                           re-stamp, re-render, and report what only you can settle
  ds spec      "<Feature>" [--touch F]     what the model already knows about a piece of work
  ds version   [--json]                    which dspec is installed, and whether it can run

The model lives in \`.ds/\` at the repo root. Every command works from any subdirectory.
\`bootstrap\` creates and \`sync\` repairs — only those two write to \`.ds/\`. Nothing exits non-zero
unless you ask for it with \`sync --strict\`, which is what a CI job runs.`;
const COMMANDS = {
    bootstrap: bootstrap_1.cmdBootstrap,
    sync: sync_1.cmdSync,
    spec: spec_1.cmdSpec,
    version: version_1.cmdVersion,
};
/** The verb set, exported so the surfaces that name commands are checked against it rather than
 *  against a hand-kept copy. Two lists of verbs is how `compile` and `map` outlived the commands. */
exports.VERBS = Object.keys(COMMANDS);
async function main(argv) {
    const [cmd, ...args] = argv;
    if (!cmd || cmd === '--help' || cmd === '-h' || cmd === 'help') {
        console.log(USAGE);
        return 0;
    }
    if (cmd === '--version' || cmd === '-v')
        return (0, version_1.cmdVersion)(args);
    const handler = COMMANDS[cmd];
    if (!handler) {
        console.error(`no such command: ${cmd}\n\n${USAGE}`);
        return 2;
    }
    try {
        return await handler(args);
    }
    catch (err) {
        // Plain message, no stack trace: the most common error here is a model file with a syntax
        // mistake, and `YamlError` already carries the file name and the line number. A Node stack
        // trace only pushes that information off the screen.
        console.error(`✗ ${err instanceof Error ? err.message : String(err)}`);
        return 1;
    }
}
//# sourceMappingURL=index.js.map