import * as ts from 'type-schema';
import { fromPairs, not, toPairs, zip } from 'ramda';
import { assert, assertPartialRequired } from './utils';

type _oschema <s extends ts.Schema> = s extends { type: ts.SchemaType.object } ? s : never;
type objectSchema = _oschema<ts.Schema>;

export class Schema <schema extends objectSchema, field extends keyof ts.buildType<schema>> {
    constructor (
        public table: string,
        public schema: schema,
        public transformer: (record: unknown) => ts.buildType<schema>,
    ) {
        // 每個欄位都要用義 db attr。db attr 指的是該欄位在資料庫裡的欄位名稱
        const withoutDbFields = Object.keys(schema.innerSchema)
        .filter(k => typeof schema.innerSchema[k].attr['db'] !== 'string');
        assert(
            withoutDbFields.length === 0,
            `fields (${withoutDbFields.join(', ')}) in ${table} schema don't have 'db' attribute`);
        
        // 每個欄位應該都要是 optional。因為任何欄位在 select 時都可能被忽略
        const nonoptionalFields = Object.keys(schema.innerSchema)
        .filter(k => not(schema.innerSchema[k].isOptional));
        assert(
            nonoptionalFields.length === 0,
            `fields (${nonoptionalFields.join(', ')}) in ${table} schema not optional`);
    }

    /** 傳回 table.field */
    tableField (field: field) {
        assert(fieldsMap(this.schema)[field] !== undefined, `${field} not included in ${this.table}`);
        return `${this.table}.${fieldsMap(this.schema)[field]}`;
    }

    /** 傳回輸出的物件欄位 */
    fields (): field[] {
        return Object.keys(this.schema.innerSchema) as field[];
    }

    /** 組出 sql fields */
    fieldsSql (fields: field[]) {
        return toPairs(fieldsMap(this.schema))
        .filter(([field, dbField]) => fields.includes(field as field))
        .map(([field, dbField]) => `${this.table}.${dbField} as ${this.table}__${dbField}`)
        .join(',');
    }

    parse <field extends keyof ts.buildType<schema>> (record: unknown, fields: field[]) {
        const prefix = `${this.table}__`;

        const pairs = toPairs(record as {[field: string]: unknown})
        .filter(([field, value]) => field.startsWith(prefix))
        .map(([field, value]) => [field.slice(prefix.length), value] as [string, unknown]);

        return assertPartialRequired(this.transformer(fromPairs(pairs)), fields);
    }
}

function fieldsMap <schema extends ts.Schema> (schema: schema): {[k in keyof ts.buildType<schema>]-?: string} {
    assert(schema.type === ts.SchemaType.object, 'is not an object schema');
    const fields = Object.keys(schema.innerSchema);
    const dbFields = fields.map(f => schema.innerSchema[f].attr.db);
    assert(dbFields.every((i): i is string => typeof i === 'string'), 'schema attr 裡未定義 db 欄位');
    return fromPairs(zip(fields, dbFields).map(([f, dbf]) => [f, dbf] as [string, string])) as any;
}
