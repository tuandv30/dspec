/** The verb set, exported so the surfaces that name commands are checked against it rather than
 *  against a hand-kept copy. Two lists of verbs is how `compile` and `map` outlived the commands. */
export declare const VERBS: string[];
export declare function main(argv: string[]): Promise<number>;
