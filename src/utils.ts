export function assert (condition: unknown, message: string): asserts condition {
    if (!condition) {
        throw new Error(message);
    }
}

type StripUndefined <type> = type extends undefined ? never : type;
type PartialRequired <o, fields extends keyof o> = {
    [k in fields]-?: StripUndefined<o[k]>;
} & Pick<o, Exclude<keyof o, fields>>;

export function assertPartialRequired <obj, fields extends keyof obj> (
    obj: obj,
    fields: fields[],
): PartialRequired<obj, fields> {
    const errors = fields.filter(f => obj[f] === undefined)
    if (errors.length > 0) {
        throw new Error(`${errors[0]} is undefined`);
    } else {
        return obj as any;
    }
}
