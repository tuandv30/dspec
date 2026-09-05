"use strict";
// ============================================================
// Step tracker — install progress, zero-dep
//
// Like spec-kit's `StepTracker`: a list of steps redrawn in place when there is a TTY, and
// **printed as flat lines when there is not**. The second branch is the one that matters: CI
// logs turn ANSI escapes into unreadable noise, and `npx ds init` inside a pipeline is an
// ordinary use, not an edge case.
// ============================================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.Tracker = void 0;
const MARK = {
    pending: '○',
    running: '◐',
    done: '✓',
    skip: '–',
    error: '✗',
};
const UP = (n) => `\u001b[${n}A`;
const CLEAR_BELOW = '\u001b[0J';
class Tracker {
    out;
    steps = [];
    drawn = 0;
    tty;
    constructor(out = process.stdout) {
        this.out = out;
        this.tty = Boolean(out.isTTY);
    }
    add(key, label) {
        this.steps.push({ key, label, state: 'pending' });
        this.render();
    }
    set(key, state, detail) {
        const s = this.steps.find((x) => x.key === key);
        if (!s)
            return;
        s.state = state;
        if (detail !== undefined)
            s.detail = detail;
        this.render();
    }
    start(key) {
        this.set(key, 'running');
    }
    done(key, detail) {
        this.set(key, 'done', detail);
    }
    skip(key, detail) {
        this.set(key, 'skip', detail);
    }
    error(key, detail) {
        this.set(key, 'error', detail);
    }
    line(s) {
        return `  ${MARK[s.state]} ${s.label}${s.detail ? ` — ${s.detail}` : ''}`;
    }
    render() {
        if (!this.tty) {
            // No TTY ⇒ print only FINISHED steps, each exactly once. `running` prints nothing: it
            // is an intermediate state, and printing it gives the log two lines for one job.
            for (const s of this.steps) {
                if (s.state === 'pending' || s.state === 'running' || s.logged)
                    continue;
                s.logged = true;
                this.out.write(this.line(s) + '\n');
            }
            return;
        }
        if (this.drawn)
            this.out.write(UP(this.drawn) + CLEAR_BELOW);
        this.out.write(this.steps.map((s) => this.line(s)).join('\n') + '\n');
        this.drawn = this.steps.length;
    }
    /** Release the cursor from the drawing area so later output is not overwritten. */
    finish() {
        this.drawn = 0;
        if (this.tty)
            this.out.write('\n');
    }
}
exports.Tracker = Tracker;
//# sourceMappingURL=tracker.js.map