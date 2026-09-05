export interface PickOptions {
    input?: NodeJS.ReadStream;
    output?: NodeJS.WriteStream;
}
/** Are we allowed to open an interactive prompt? */
export declare function canPrompt(input?: NodeJS.ReadStream): boolean;
/**
 * A one-line yes/no question.
 *
 * Only called when `canPrompt()` — for the reason at the top of this file. An empty Enter takes
 * `def`, so a terminal that returns EOF immediately still does not hang.
 */
export declare function confirm(question: string, def: boolean, opts?: PickOptions): Promise<boolean>;
