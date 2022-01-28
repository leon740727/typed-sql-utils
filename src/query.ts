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

    resolve (): condition {
        const conditions = this.items.map(i => i.resolve());
        return {
            sql: `(${conditions.map(sql => sql.sql).join(` ${this.cmd} `)})`,
            parameters: conditions.reduce((acc, i) => acc.concat(i.parameters), [] as unknown[]),
        }
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

    abstract clone (): this;

    not (query: Query): this {
        const sql = query.resolve();
        const sql2 = {
            sql: `not (${sql.sql})`,
            parameters: sql.parameters,
        }
        const result = this.clone();
        result.conditions = result.conditions.concat([sql2]);
        return result;
    }

    resolve (): condition {
        if (this.conditions.length === 0) {
            return {
                sql: '(1 = 1)',
                parameters: [],
            }
        } else {
            return {
                sql: `(${this.conditions.map(cond => cond.sql).join(' and ')})`,
                parameters: this.conditions.map(cond => cond.parameters).reduce((acc, i) => acc.concat(i), []),
            }
        }
    }
}
