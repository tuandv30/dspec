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

import * as fs from 'node:fs';
import * as path from 'node:path';
import { execFileSync } from 'node:child_process';
import { SPEC_DIR } from '../../model/load';
import { findRepo } from '../repo';
import { parseFlags } from '../args';
import { packageRoot, packageVersion } from '../../pkgRoot';
import { readManifest, MANIFEST_FILE } from '../../install/manifest';
import { plural } from '../../text';
import { MARKETPLACE, PLUGIN_ID, readDeclaration } from '../../install/project';

type Level = 'ok' | 'warn' | 'info';

interface Finding {
  level: Level;
  label: string;
  detail: string;
  /** Something the user can type to fix it. */
  fix?: string;
}

const MARK: Record<Level, string> = { ok: '✓', warn: '!', info: '·' };

const USAGE = `ds version [--json]

  Which dspec is installed, and whether it can run: Node, git, the plugin declaration, the model.
  Always exits 0.

  It never reports what the LATEST version is — that needs a network call, and dspec makes none.
  Run \`/ds:update\` to take a newer release.
  Where the model and the code disagree is the job of \`ds sync\`.`;

export function cmdVersion(argv: string[]): number {
  const { values } = parseFlags<{ json?: boolean; help?: boolean }>(argv, {
    json: { type: 'boolean' },
    help: { type: 'boolean', short: 'h' },
  });
  if (values.help) {
    console.log(USAGE);
    return 0;
  }

  const repo = findRepo();
  const out: Finding[] = [];

  // ---- environment -----------------------------------------------------
  //
  // ⚠️ This is a VERSION check, not a PRESENCE check, and it cannot be otherwise: the number it
  // reads is the version of the Node already running this process. A missing Node cannot be
  // reported here because a missing Node means `doctor` never started — every command and hook
  // is `node "${CLAUDE_PLUGIN_ROOT}/…"`. The symptom is silence, and the place it is diagnosed
  // is the troubleshooting table, not here.
  const major = Number(process.versions.node.split('.')[0]);
  out.push(
    major >= 20
      ? { level: 'ok', label: 'node', detail: `v${process.versions.node}` }
      : { level: 'warn', label: 'node', detail: `v${process.versions.node} — dspec needs ≥ 20`, fix: 'upgrade Node to an LTS release' },
  );

  let gitVersion = '';
  try {
    gitVersion = execFileSync('git', ['--version'], { encoding: 'utf-8' }).trim();
  } catch {
    /* no git */
  }
  out.push(
    gitVersion
      ? { level: 'ok', label: 'git', detail: gitVersion }
      : { level: 'warn', label: 'git', detail: 'not on PATH — dspec reads `git ls-files` to know which source files exist' },
  );

  // ⚠️ The PATH matters as much as the number. A plugin is cached under
  // `~/.claude/plugins/cache/<marketplace>/<plugin>/<version>/`, so this is how somebody
  // reporting a bug tells us WHICH copy answered — the installed plugin, or a checkout they are
  // hacking on. Two dspecs on one machine answering differently is otherwise unexplainable.
  out.push({ level: 'info', label: 'installed at', detail: packageRoot() });

  // ---- repo ------------------------------------------------------------
  const root = path.join(repo, SPEC_DIR);
  if (!fs.existsSync(root)) {
    out.push({ level: 'warn', label: 'model', detail: `no ${SPEC_DIR}/ in ${repo}`, fix: 'ds bootstrap --here' });
    return report(out, values.json, repo);
  }
  out.push({ level: 'ok', label: 'model', detail: `${SPEC_DIR}/ at ${repo}` });

  // ---- the plugin declaration ------------------------------------------
  //
  // This is what makes a teammate's checkout work. `extraKnownMarketplaces` says where dspec
  // comes from and `enabledPlugins` says this project uses it; without both, cloning the repo
  // gets the model and none of the loop, and nothing anywhere says why.
  const decl = readDeclaration(repo);
  if (!decl.marketplace) {
    out.push({
      level: 'warn',
      label: 'plugin',
      detail: `.claude/settings.json does not declare the \`${MARKETPLACE.name}\` marketplace — a teammate cloning this repo gets no loop`,
      fix: 'ds bootstrap --here',
    });
  } else if (decl.enabled === null) {
    out.push({ level: 'warn', label: 'plugin', detail: `the marketplace is declared but \`${PLUGIN_ID}\` is not in enabledPlugins`, fix: 'ds bootstrap --here' });
  } else if (!decl.enabled) {
    // Deliberately turned off. Say it and move on — `init` will not flip it back.
    out.push({ level: 'info', label: 'plugin', detail: `\`${PLUGIN_ID}\` is declared but switched OFF in this project` });
  } else {
    out.push({ level: 'ok', label: 'plugin', detail: `${PLUGIN_ID} · from ${MARKETPLACE.repo}` });
  }

  // ---- manifest --------------------------------------------------------
  //
  // `install.json` no longer tracks installed files — the plugin owns those, and dspec writes
  // nothing outside `.ds/`. What is left is the one fact worth keeping: WHICH dspec wrote
  // this model. It is the first question behind every "why does my model look odd" report.
  const manifest = readManifest(repo);
  if (!manifest) {
    out.push({ level: 'info', label: 'manifest', detail: `no ${MANIFEST_FILE} — written by \`ds bootstrap\``, fix: 'ds bootstrap --here' });
  } else {
    const stale = manifest.files.length;
    out.push({
      level: 'ok',
      label: 'manifest',
      detail: `written by dspec ${manifest.dspec}`
        + (stale ? ` · ${plural(stale, 'file')} recorded by an older version, no longer managed` : ''),
    });
  }

  return report(out, values.json, repo);
}

function report(out: Finding[], json: boolean | undefined, repo: string): number {
  if (json) {
    console.log(JSON.stringify({ version: packageVersion(), root: packageRoot(), repo, findings: out }, null, 2));
    return 0;
  }
  // The headline first: it is the question the command was asked. Everything below explains why
  // that version might not be behaving as expected.
  console.log(`\ndspec ${packageVersion()}\n`);
  for (const f of out) {
    console.log(`  ${MARK[f.level]} ${f.label.padEnd(15)} ${f.detail}`);
    if (f.fix && f.level === 'warn') console.log(`  ${' '.repeat(17)}→ ${f.fix}`);
  }
  const warns = out.filter((f) => f.level === 'warn').length;
  // Exits 0 even with warnings — see the file header. Only the summary line changes.
  console.log(warns
    ? `\n${plural(warns, 'thing')} to look at — none of them blocks anything.`
    : '\nHealthy. Run `/ds:update` to check for a newer release.');
  return 0;
}
