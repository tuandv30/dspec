"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MARK = void 0;
exports.lintLine = lintLine;
function lintLine(f) {
    const where = f.feature ?? f.subject ?? '';
    return `${where ? `${where}: ` : ''}${f.detail}`;
}
/** `error` · `warn` · `info` as a fixed-width marker, so a list of findings reads as a column. */
exports.MARK = { error: '✗', warn: '!', info: '·' };
//# sourceMappingURL=lintMessage.js.map