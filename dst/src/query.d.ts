export declare type condition = {
    sql: string;
    parameters: unknown[];
};
export declare namespace condition {
    type variable = {
        value: unknown;
    };
    export let placeholder: string;
    export function make(queryParts: TemplateStringsArray, ...parameters: (string | variable)[]): condition;
    export function value(value: unknown): variable;
    export {};
}
declare class QueryList {
    private cmd;
    private items;
    constructor(cmd: 'and' | 'or', items: (Query | QueryList)[]);
    get sql(): string;
    get parameters(): unknown[];
}
export declare abstract class Query {
    protected conditions: condition[];
    constructor(conditions?: condition[]);
    static and(queries: (Query | QueryList)[]): QueryList;
    static or(queries: (Query | QueryList)[]): QueryList;
    abstract _clone(): this;
    get sql(): string;
    get parameters(): unknown[];
    not(query: Query): this;
}
export {};
