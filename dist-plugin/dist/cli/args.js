"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseFlags = parseFlags;
exports.csv = csv;
const node_util_1 = require("node:util");
function parseFlags(args, options) {
    const cfg = {
        args,
        options: options,
        allowPositionals: true,
        strict: true,
    };
    try {
        const { values, positionals } = (0, node_util_1.parseArgs)(cfg);
        return { values: values, positionals: positionals };
    }
    catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        // `parseArgs` throws a long message with a `--help` suggestion appended; the first line
        // is enough to identify which flag was mistyped.
        throw new Error(msg.split('\n')[0]);
    }
}
/** `--touch A/x,B/y` or `--touch A/x --touch B/y` → `['A/x','B/y']`, deduplicated. */
function csv(value) {
    if (value === undefined)
        return [];
    const raw = Array.isArray(value) ? value : [value];
    const out = [];
    for (const chunk of raw) {
        for (const part of String(chunk).split(',')) {
            const v = part.trim();
            if (v && !out.includes(v))
                out.push(v);
        }
    }
    return out;
}
//# sourceMappingURL=args.js.map