---
name: CLI command surface
area: Delivery
code:
  - bin/ds.js
  - src/cli/index.ts
  - src/cli/args.ts
  - src/cli/repo.ts
  - src/pkgRoot.ts
  - src/text.ts
entry: main
tests: [test/contract/cli.test.js, test/contract/suite.test.js]
stamp: sha256f:437166f4d1436e38
---

The `ds` command itself: argument parsing, subcommand dispatch, locating the repository root, and
the small shared helpers every command leans on.

Rules
- **One flat set, and every verb is a command the user knows by name.** The listing was once split
  into "what you type" and "what the hooks call", which invited verbs that existed only because
  something used to call them — `init`, `drift`, `doctor`, `pack`, `whose` and `check` all survived
  that way, each overlapping a neighbour. If a user cannot name it, it is not a command, and its
  job belongs to a flag on one they can.
- **The verb set is exported, so no surface keeps its own copy.** Three hand-kept lists were still
  retargeting `ds compile` and `ds map` two rounds after those commands were deleted; rewriting a
  verb the CLI does not have tells the agent to run something that fails.
- **Nothing of dspec's is installed on the user's PATH.** There is no binary and no package to
  install; every command runs as the plugin's own script under whatever Node the session has. What
  the user does not install is dspec; what they do need is a runtime for it.
- **`bootstrap` creates and `sync` repairs, and only those two write to the model.** The help text
  states it, and the command surface is where that invariant is visible.
- **Every command works from any subdirectory** — the repository root is the nearest ancestor
  holding the model directory.
- **Nothing exits non-zero unless asked.** `sync --strict` is the CI gate and nothing else turns
  it on: a command that failed by default would make every other use of it a hazard.

Behaviour
- An unknown subcommand prints the usage rather than failing silently, since that text is what an
  agent reads when it mistypes.
