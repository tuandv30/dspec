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

import * as readline from 'node:readline/promises';

export interface PickOptions {
  input?: NodeJS.ReadStream;
  output?: NodeJS.WriteStream;
}

/** Are we allowed to open an interactive prompt? */
export function canPrompt(input: NodeJS.ReadStream = process.stdin): boolean {
  return Boolean(input.isTTY);
}

/**
 * A one-line yes/no question.
 *
 * Only called when `canPrompt()` — for the reason at the top of this file. An empty Enter takes
 * `def`, so a terminal that returns EOF immediately still does not hang.
 */
export async function confirm(question: string, def: boolean, opts: PickOptions = {}): Promise<boolean> {
  const rl = readline.createInterface({ input: opts.input ?? process.stdin, output: opts.output ?? process.stdout });
  try {
    const answer = (await rl.question(`${question} ${def ? '[Y/n]' : '[y/N]'} `)).trim().toLowerCase();
    if (!answer) return def;
    return answer === 'y' || answer === 'yes';
  } finally {
    rl.close();
  }
}
