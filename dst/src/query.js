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
    get sql() {
        const s = this.items.map(i => i.sql).join(` ${this.cmd} `);
        return `(${s})`; // 整個 query list 是一整組，要跟其他的 query 區分開來
    }
    get parameters() {
        return this.items.map(i => i.parameters).flat();
    }
}
class Query {
    constructor(conditions = []) {
        this.conditions = conditions;
    }
    static and(queries) {
        return new QueryList('and', queries);
    }
    static or(queries) {
        return new QueryList('or', queries);
    }
    get sql() {
        if (this.conditions.length === 0) {
            return '(1 = 1)';
        }
        else {
            return `(${this.conditions.map(cond => cond.sql).join(' and ')})`;
        }
    }
    get parameters() {
        if (this.conditions.length === 0) {
            return [];
        }
        else {
            return this.conditions.map(cond => cond.parameters).flat();
        }
    }
    not(query) {
        const result = this._clone();
        result.conditions = result.conditions.concat([{
                sql: `not (${query.sql})`,
                parameters: query.parameters,
            }]);
        return result;
    }
}
exports.Query = Query;
