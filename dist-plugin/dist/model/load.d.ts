import type { Loaded } from './types';
export declare const SPEC_DIR = ".ds";
export declare const FEATURES_DIR = "features";
export declare const PRODUCT_FILE = "product.md";
export declare const GLOSSARY_FILE = "glossary.md";
export declare const INDEX_FILE = "index.md";
/**
 * Load the whole model from `<repo>/.ds/`.
 *
 * `repo` is the repo root, not the `.ds` directory — so every path this returns is relative to the
 * repo root, the same form `code:` uses, and the two can be compared without any caller having to
 * normalise them.
 */
export declare function loadModel(repo: string): Loaded;
/** Does this repo hold a model at all? Asked before every command that reads one. */
export declare function hasModel(repo: string): boolean;
