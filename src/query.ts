import { zip } from 'ramda';

export type condition = {
    sql: string;
    parameters: unknown[];
}

export namespace condition {
    type variable = { value: unknown };
    
    export let placeholder = '?';

    export function make (queryParts: TemplateStringsArray, ...parameters: (string | variable)[]): condition {
        const texts = parameters.map(p => {
            if (typeof p === 'string') {
                return p;
            } else {
                if (Array.isArray(p.value)) {
                    return p.value.map(_ => placeholder).join(',');
                } else {
                    return placeholder;
                }
            }
        });
        const sql = zip(queryParts, texts).map(([p, t]) => p + t).join('') + queryParts.slice(-1)[0];
    
        const ps = parameters
        .filter((p): p is variable => typeof p !== 'string')
        .map(v => v.value)
        .flat();
    
        return {
            sql,
            parameters: ps,
        }
    }

    export function value (value: unknown): variable {
        return { value };
    }
}

class QueryList {
    constructor (
        private cmd: 'and' | 'or',
        private items: (Query | QueryList)[],
    ) {}

    get sql (): string {
        const s = this.items.map(i => i.sql).join(` ${this.cmd} `);
        return `(${s})`;        // 整個 query list 是一整組，要跟其他的 query 區分開來
    }

    get parameters (): unknown[] {
        return this.items.map(i => i.parameters).flat();
    }
}

export abstract class Query {
    constructor (protected conditions: condition[] = []) {}

    static and (queries: (Query | QueryList)[]): QueryList {
        return new QueryList('and', queries);
    }

    static or (queries: (Query | QueryList)[]): QueryList {
        return new QueryList('or', queries);
    }

    abstract _clone (): this;

    get sql () {
        if (this.conditions.length === 0) {
            return '(1 = 1)';
        } else {
            return `(${this.conditions.map(cond => cond.sql).join(' and ')})`;
        }
    }

    get parameters (): unknown[] {
        if (this.conditions.length === 0) {
            return [];
        } else {
            return this.conditions.map(cond => cond.parameters).flat();
        }
    }

    not (query: Query): this {
        const result = this._clone();
        result.conditions = result.conditions.concat([{
            sql: `not (${query.sql})`,
            parameters: query.parameters,
        }]);
        return result;
    }
}
