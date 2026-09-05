---
name: Slash commands and skill
area: Agent surface
code:
  - plugin/commands/bootstrap.md
  - plugin/commands/spec.md
  - plugin/commands/plan.md
  - plugin/commands/sync.md
  - plugin/commands/version.md
  - plugin/commands/update.md
  - plugin/skills/ds/SKILL.md
  - plugin/.claude-plugin/plugin.json
uses: [Body vocabulary]
tests: [test/contract/invariants.test.js]
stamp: sha256f:af83978c20eabb1d
---

The prose that reaches the user's agent: six commands and one skill. **This is the product's real
interface.** dspec is a toolkit and the agent is the brain, so everything else here only measures —
these files are what turn a measurement into a decision somebody acts on.

There is one kind of command. A verb the CLI has but no user could name is not a command; its job
belongs to a flag on one they can. `init`, `drift`, `doctor`, `pack`, `whose` and `check` each
survived a redesign that way, every one of them overlapping a neighbour.

Rules
- **A command's tool list is its fence, and the fence is the only instruction that is actually
  enforced.** The spec command ships with no write tool at all, so it cannot leave the model
  describing something that does not exist yet.
- **A command never hard-codes another command's name.** Placeholders are resolved at build time, so
  an in-repo install and the published plugin can never disagree about how a command is typed. A
  hard-coded name is a second spelling that goes stale on its own.
- **The vocabulary is never hand-written here.** It is injected from its single declaration, so a
  surface teaching the language cannot drift from what the linter enforces.
- **Ask, do not infer.** Where the model is thin, the instruction is to ask the user rather than to
  fill the gap from the code, from naming, or from convention — that guess is exactly what the whole
  system exists to prevent.
- **Boundary and scope decisions belong to the user.** Proposing is the command's job; deciding is
  not.

Behaviour
- `bootstrap` **creates** and `sync` **repairs** — different intentions, so different commands.
  Running the wrong one buries a curated model under proposals, or leaves a missing one missing.
- `version` reports what is installed; `update` walks the user through Claude Code's own plugin
  commands, because taking a release needs a network call dspec will not make.
- Describe → plan → build → reconcile. Only the last step writes to the model, and it is offered
  after the code exists rather than before.
