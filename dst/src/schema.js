"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Schema = void 0;
const ts = require("type-schema");
const ramda_1 = require("ramda");
const utils_1 = require("./utils");
class Schema {
    constructor(table, schema, transformer) {
        this.table = table;
        this.schema = schema;
        this.transformer = transformer;
        // 每個欄位都要用義 db attr。db attr 指的是該欄位在資料庫裡的欄位名稱
        const withoutDbFields = Object.keys(schema.innerSchema)
            .filter(k => typeof schema.innerSchema[k].attr['db'] !== 'string');
        (0, utils_1.assert)(withoutDbFields.length === 0, `fields (${withoutDbFields.join(', ')}) in ${table} schema don't have 'db' attribute`);
        // 每個欄位應該都要是 optional。因為任何欄位在 select 時都可能被忽略
        const nonoptionalFields = Object.keys(schema.innerSchema)
            .filter(k => (0, ramda_1.not)(schema.innerSchema[k].isOptional));
        (0, utils_1.assert)(nonoptionalFields.length === 0, `fields (${nonoptionalFields.join(', ')}) in ${table} schema not optional`);
    }
    /** 傳回 table.field */
    tableField(field) {
        (0, utils_1.assert)(fieldsMap(this.schema)[field] !== undefined, `${field} not included in ${this.table}`);
        return `${this.table}.${fieldsMap(this.schema)[field]}`;
    }
    /** 傳回輸出的物件欄位 */
    fields() {
        return Object.keys(this.schema.innerSchema);
    }
    /** 組出 sql fields */
    fieldsSql(fields) {
        return (0, ramda_1.toPairs)(fieldsMap(this.schema))
            .filter(([field, dbField]) => fields.includes(field))
            .map(([field, dbField]) => `${this.table}.${dbField} as ${this.table}__${dbField}`)
            .join(',');
    }
    parse(record, fields) {
        const prefix = `${this.table}__`;
        const pairs = (0, ramda_1.toPairs)(record)
            .filter(([field, value]) => field.startsWith(prefix))
            .map(([field, value]) => [field.slice(prefix.length), value]);
        return (0, utils_1.assertPartialRequired)(this.transformer((0, ramda_1.fromPairs)(pairs)), fields);
    }
}
exports.Schema = Schema;
function fieldsMap(schema) {
    (0, utils_1.assert)(schema.type === ts.SchemaType.object, 'is not an object schema');
    const fields = Object.keys(schema.innerSchema);
    const dbFields = fields.map(f => schema.innerSchema[f].attr.db);
    (0, utils_1.assert)(dbFields.every((i) => typeof i === 'string'), 'schema attr 裡未定義 db 欄位');
    return (0, ramda_1.fromPairs)((0, ramda_1.zip)(fields, dbFields).map(([f, dbf]) => [f, dbf]));
}
