export type StepState = 'pending' | 'running' | 'done' | 'skip' | 'error';
export declare class Tracker {
    private readonly out;
    private steps;
    private drawn;
    private readonly tty;
    constructor(out?: NodeJS.WriteStream);
    add(key: string, label: string): void;
    set(key: string, state: StepState, detail?: string): void;
    start(key: string): void;
    done(key: string, detail?: string): void;
    skip(key: string, detail?: string): void;
    error(key: string, detail?: string): void;
    private line;
    private render;
    /** Release the cursor from the drawing area so later output is not overwritten. */
    finish(): void;
}
