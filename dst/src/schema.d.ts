import * as ts from 'type-schema';
declare type _oschema<s extends ts.Schema> = s extends {
    type: ts.SchemaType.object;
} ? s : never;
declare type objectSchema = _oschema<ts.Schema>;
export declare class Schema<schema extends objectSchema, field extends keyof ts.buildType<schema>> {
    table: string;
    schema: schema;
    transformer: (record: unknown) => ts.buildType<schema>;
    constructor(table: string, schema: schema, transformer: (record: unknown) => ts.buildType<schema>);
    /** 傳回 table.field */
    tableField(field: field): string;
    /** 傳回輸出的物件欄位 */
    fields(): field[];
    /** 組出 sql fields */
    fieldsSql(fields: field[]): string;
    parse<field extends keyof ts.buildType<schema>>(record: unknown, fields: field[]): { [k in field]-?: import("type-schema/dst/src/type").build<schema, true>[k] extends undefined ? never : import("type-schema/dst/src/type").build<schema, true>[k]; } & Pick<import("type-schema/dst/src/type").build<schema, true>, Exclude<keyof import("type-schema/dst/src/type").build<schema, true>, field>>;
}
export {};
