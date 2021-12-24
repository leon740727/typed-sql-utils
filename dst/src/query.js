"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Query = exports.condition = void 0;
const ramda_1 = require("ramda");
var condition;
(function (condition) {
    condition.placeholder = '?';
    function make(queryParts, ...parameters) {
        const texts = parameters.map(p => {
            if (typeof p === 'string') {
                return p;
            }
            else {
                if (Array.isArray(p.value)) {
                    return p.value.map(_ => condition.placeholder).join(',');
                }
                else {
                    return condition.placeholder;
                }
            }
        });
        const sql = (0, ramda_1.zip)(queryParts, texts).map(([p, t]) => p + t).join('') + queryParts.slice(-1)[0];
        const ps = parameters
            .filter((p) => typeof p !== 'string')
            .map(v => v.value)
            .flat();
        return {
            sql,
            parameters: ps,
        };
    }
    condition.make = make;
    function value(value) {
        return { value };
    }
    condition.value = value;
})(condition = exports.condition || (exports.condition = {}));
class QueryList {
    constructor(cmd, items) {
        this.cmd = cmd;
        this.items = items;
    }
    resolve() {
        const conditions = this.items.map(i => i.resolve());
        return {
            sql: `(${conditions.map(sql => sql.sql).join(` ${this.cmd} `)})`,
            parameters: conditions.reduce((acc, i) => acc.concat(i.parameters), []),
        };
    }
}
class Query {
    constructor(conditions) {
        this.conditions = conditions;
    }
    static and(queries) {
        return new QueryList('and', queries);
    }
    static or(queries) {
        return new QueryList('or', queries);
    }
    not(query) {
        const sql = query.resolve();
        const sql2 = {
            sql: `not (${sql.sql})`,
            parameters: sql.parameters,
        };
        const result = this.clone();
        result.conditions = result.conditions.concat([sql2]);
        return result;
    }
    resolve() {
        return {
            sql: `(${this.conditions.map(cond => cond.sql).join(' and ')})`,
            parameters: this.conditions.map(cond => cond.parameters).reduce((acc, i) => acc.concat(i), []),
        };
    }
}
exports.Query = Query;
