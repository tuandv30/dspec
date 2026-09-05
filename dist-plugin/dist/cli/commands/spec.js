"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cmdSpec = cmdSpec;
// `ds spec "<Feature>"` — what the model already knows about a piece of work.
//
// The measurement behind `/ds:spec` and `/ds:plan`. It resolves a NAME and never guesses: see the header
// of `compile/pack.ts` for the failure that rule exists to prevent.
const load_1 = require("../../model/load");
const pack_1 = require("../../compile/pack");
const args_1 = require("../args");
const repo_1 = require("../repo");
const USAGE = `ds spec "<Feature>" [--touch <Feature>]

  What the model knows about a piece of work: the product rules, the feature named, the features
  it uses, the files bound to them, and an explicit warning wherever the model is too thin to
  trust.

  Retrieval resolves NAMES, never word overlap. A request naming no feature is told so, and the
  index is printed for you to choose from.

  --touch <Feature>   pull a feature in by name (repeatable, or comma-separated)`;
function cmdSpec(args) {
    const { values, positionals } = (0, args_1.parseFlags)(args, {
        touch: { type: 'string', multiple: true },
        help: { type: 'boolean' },
    });
    const request = positionals.join(' ').trim();
    if (values.help || !request) {
        console.log(USAGE);
        return request ? 0 : 2;
    }
    const repo = (0, repo_1.findRepo)();
    const { model } = (0, load_1.loadModel)(repo);
    console.log((0, pack_1.renderPack)(repo, model, request, { touch: (0, args_1.csv)(values.touch) }));
    return 0;
}
//# sourceMappingURL=spec.js.map