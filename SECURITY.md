# Security Policy

## Reporting a vulnerability

Please report security issues privately, **not** as a public issue: open a
[GitHub security advisory](https://github.com/tuna781/dspec/security/advisories/new), or email
<tuandv.job@gmail.com>.

Please include what you were running, the steps to reproduce, and what an attacker gets out of
it. Expect a first reply within a week.

## What dspec does and does not do

Worth knowing before you go looking, because it narrows the surface a lot:

- **No runtime dependencies.** `package.json` has an empty dependency set; the only dev
  dependencies are TypeScript and `@types/node`. There is no supply chain to speak of.
- **No network calls, and no listening socket.** Nothing is sent anywhere, there is no telemetry,
  and there is no account, token or server. Every command reads and writes local files and exits.
- **It writes to your repo, and only these files.** `ds bootstrap` seeds `.ds/` — skipping
  anything already there, so it never overwrites a spec you wrote — adds two keys to
  `.claude/settings.json`, and appends one line to `.gitignore`. `ds compile` writes the
  artifacts you asked for. `ds map --write` rewrites the `hash` field in your spec frontmatter,
  and `ds sync --write` is those two together. Nothing else is created, and no file outside
  `.ds/` is treated as ours to replace. `ds sync` never rewrites a spec body and never deletes
  an element: those are decisions, not measurements.
- **`.claude/settings.json` is merged, never overwritten**, and if it is not valid JSON
  **nothing at all is written to it** and you are told. That file is yours, and one stray comma
  must never cost somebody their whole configuration.
- **The plugin ships executable JavaScript that Claude Code runs as hooks** — on session start,
  after a file edit, and on stop. They only ever run the bundled CLI and print what it says;
  every path exits 0, and none of them can block a tool call. They are in `dist-plugin/hooks/`,
  and they are short enough to read.
- **The plugin's slash commands are permitted as `Bash(node:*)`.** Inside a plugin the CLI is
  addressed by an interpolated absolute path (`node "${CLAUDE_PLUGIN_ROOT}/bin/ds.js" …`), and a
  narrower per-subcommand allowlist cannot match that — a permission entry that does not match
  blocks the command silently, with no reason shown. The practical effect is worth stating
  plainly: approving these commands approves running `node`, not only running dspec.
- **It shells out to `git`** to list tracked files, to read a model at another revision, and to
  find the repo root. It reads; it never commits, pushes or rewrites history.
- **It reads your source files** to fingerprint the symbols your specs point at. Those
  fingerprints are hashes, stored in your own repo.

## Supported versions

DSpec is distributed only as a Claude Code plugin, from
[`tuna781/dspec`](https://github.com/tuna781/dspec). It is published nowhere else — there is no
npm package, and anything claiming to be one is not ours.

Fixes land on the latest released version only. Take them with `/plugin update ds`; the version
you are running is shown by `ds doctor` and in Claude Code's `/plugin` manager.
