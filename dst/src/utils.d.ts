export declare function assert(condition: unknown, message: string): asserts condition;
declare type StripUndefined<type> = type extends undefined ? never : type;
declare type PartialRequired<o, fields extends keyof o> = {
    [k in fields]-?: StripUndefined<o[k]>;
} & Pick<o, Exclude<keyof o, fields>>;
export declare function assertPartialRequired<obj, fields extends keyof obj>(obj: obj, fields: fields[]): PartialRequired<obj, fields>;
export {};
