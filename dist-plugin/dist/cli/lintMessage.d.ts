import type { Finding } from '../compile/lint';
export declare function lintLine(f: Finding): string;
/** `error` · `warn` · `info` as a fixed-width marker, so a list of findings reads as a column. */
export declare const MARK: Record<Finding['severity'], string>;
