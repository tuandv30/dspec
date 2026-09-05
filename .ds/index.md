<!-- ds: project=dspec generated=2026-09-05T12:00:36.254Z -->
# dspec — product index

Every feature in this product: what it is, where it lives, and what it depends on.
Generated from `.ds/features/` — do not edit by hand.

## Agent surface

- **Session hooks** — Three hooks that run without being asked
  → `plugin/hooks/hooks.json`, `plugin/hooks/_ds.js`, `plugin/hooks/session-start.js`, `plugin/hooks/post-edit.js`, `plugin/hooks/stop.js` · uses: Reconciliation, Drift detection, Model loading
- **Slash commands and skill** — The prose that reaches the user's agent: six commands and one skill
  → `plugin/commands/bootstrap.md`, `plugin/commands/spec.md`, `plugin/commands/plan.md`, `plugin/commands/sync.md`, `plugin/commands/version.md`, `plugin/commands/update.md`, `plugin/skills/ds/SKILL.md`, `plugin/.claude-plugin/plugin.json` · uses: Body vocabulary

## Artifacts

- **Artifact rendering** — Turns the model into the two files an agent actually reads — `.ds/index.md`, the entry point, and `CLAUDE.md`, a pointer at it — and answers whether either has fallen…
  → `src/compile/renderers.ts`, `src/compile/artifacts.ts` · uses: Model loading

## Code measurement

- **Code fingerprint** — Turns "is this description still true of the code?" into a measurement
  → `src/code/hash.ts`, `src/cli/commands/stamp.ts` · uses: Model loading
- **Coverage gap** — The mirror of drift — **code nobody described**
  → `src/code/coverage.ts` · uses: Source inventory, Model loading
- **Drift detection** — Walks the model and asks, of every feature: do the files it names still exist, is its reading entry still there, do its tests still exist, and has any of it changed…
  → `src/code/staleness.ts` · uses: Code fingerprint, Source inventory, Model loading
- **Git access** — Everything dspec needs from git: whether this is a repository at all, and how to read a model as it stood at another revision
  → `src/git/rev.ts`
- **Source inventory** — Which files count as this product's source: the denominator of coverage, and the candidate set when hunting for an entry symbol that has moved
  → `src/code/sources.ts` · uses: Git access

## Delivery

- **CLI command surface** — The `ds` command itself: argument parsing, subcommand dispatch, locating the repository root, and the small shared helpers every command leans on
  → `bin/ds.js`, `src/cli/index.ts`, `src/cli/args.ts`, `src/cli/repo.ts`, `src/pkgRoot.ts`, `src/text.ts`
- **Plugin build** — Resolves the plugin templates into the installable plugin
  → `scripts/build-plugin.js`, `src/install/render.ts` · uses: Body vocabulary, Slash commands and skill
- **Release** — Cuts a release: writes the version into every file that carries it, rebuilds the plugin, runs the suite, commits, and puts the tag on that commit
  → `scripts/release.js`, `scripts/publish-release.js` · uses: Plugin build

## Language

- **Body vocabulary** — The single declaration of dspec-lang's own vocabulary — the frontmatter keys a feature file may declare, the body labels it may use, their glosses and their examples —…
  → `src/model/language.ts`, `src/model/sections.ts`
- **Model loading** — Turns `.ds/` into the one structure every other feature reads
  → `src/model/load.ts`, `src/model/types.ts` · uses: Spec file format, Body vocabulary
- **Spec file format** — Every file in `.ds/` is markdown with YAML frontmatter, parsed by a hand-written YAML subset with zero dependencies
  → `src/model/yaml.ts`, `src/model/frontmatter.ts`

## Model quality

- **Spec quality lint** — A pure function over the model that teaches the standard the way a linter does — nobody reads a style guide, everybody fixes the red underline
  → `src/compile/lint.ts`, `src/cli/lintMessage.ts` · uses: Model loading, Body vocabulary, Coverage gap, Drift detection
- **Work list** — Answers "what does this project still owe?" — and answers it **derived, never stored**
  → `src/compile/worklist.ts` · uses: Drift detection, Spec quality lint, Artifact rendering, Git access

## Retrieval

- **Context pack** — How a piece of work reaches the model: given a request, assemble what the model already knows — the product rules, the feature named, the features it uses, the files…
  → `src/compile/pack.ts`, `src/cli/commands/spec.ts` · uses: Model loading, Spec quality lint, Drift detection

## Setup

- **Model creation** — Creates the model for a repository that has none: writes `.ds/`, declares the plugin so a teammate who clones gets the loop without being told, and proposes one…
  → `src/cli/commands/scaffold.ts`, `src/cli/commands/bootstrap.ts` · uses: Source inventory, Body vocabulary, Plugin declaration
- **Plugin declaration** — Declares the plugin in the project's Claude Code settings, so a teammate who clones the repo gets the loop without being told to install anything, and records which…
  → `src/install/project.ts`, `src/install/manifest.ts`, `src/install/tracker.ts`, `src/install/prompt.ts` · uses: Body vocabulary

## The loop

- **Reconciliation** — Reconciles the model with the checkout in **both** directions and repairs what is safe to repair: restores base files that have gone missing, re-stamps every feature,…
  → `src/cli/commands/sync.ts` · uses: Code fingerprint, Coverage gap, Work list, Artifact rendering, Model creation, Plugin declaration
- **Version and health** — Answers "which dspec is installed, and can it run?" — the version first, because that is the question being asked, then the checks that explain why that version might…
  → `src/cli/commands/version.ts` · uses: Plugin declaration
