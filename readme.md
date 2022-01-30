### example

```typescript
import * as ts from 'type-schema';
import { condition, Schema, Query as BaseQuery } from './index';

// placeholder 預設為 '?'，可以改為 oracledb 所用的 ':0'
condition.placeholder = ':0';

const dataSchema = ts.object({
    // 每個欄位都要設為 optional。因為這代表的是 sql select 的結果。而 select 可以選擇任意欄位
    id: ts.string().optional().set({ db: 'id' }), // { db: 'id' } 代表這個欄位在資料庫的名稱
    name: ts.string().optional().set({ db: 'name' }),
    birthDay: ts.date().optional().set({ db: 'bday' }),
});

type person = ts.buildType<typeof dataSchema>;

function fromRecord (record: any): person {
    return {
        id: record['id'],
        name: record['name'],
        birthDay: record['bday'] ? new Date(Date.parse(record['bday'])) : undefined,
    }
}

const schema = new Schema('person', dataSchema, fromRecord);

class Query extends BaseQuery {
    // 每個子類別都要實作這個函式
    _clone (): this {
        return new Query(this.conditions) as this;
    }

    byPartialName (partialName: string) {
        const field = schema.tableField('name');
        const cond = condition.make`${field} like ${condition.value(`%${partialName}%`)}`;
        return new Query(this.conditions.concat([cond]));
    }

    byBornYear (year: number) {
        const field = schema.tableField('birthDay');
        const cond = condition.make`${field} like ${condition.value(`${year}-%`)}`;
        return new Query(this.conditions.concat([cond]));
    }
}

// Query 的用法
const q1 = new Query()
    .byPartialName('leon')
    .byBornYear(2021);
console.log(q1.resolve());          // '(person.name like :0 and person.bday like :0)'

const q2 = new Query()
    .byPartialName('leon')
    .not(new Query().byBornYear(2021));
console.log(q2.resolve());          // '(person.name like :0 and not ((person.bday like :0)))'

const q3 = Query.or([
    new Query().byPartialName('leon'),
    new Query().byBornYear(2021),
]);
console.log(q3.resolve());          // '((person.name like :0) or (person.bday like :0))'

console.log(new Query().resolve()); // '(1 = 1)'

console.log(schema.fields());       // ['id', 'name', 'birthDay']

// 組合在一起
(async () => {
    const conn = {} as any;         // get db connection...
    const q = new Query().byPartialName('leon').resolve();
    const fields = schema.fieldsSql(['id', 'name']);
    const table = schema.table;
    const sql = `select ${fields} from ${table} where ${q.sql}`;
    console.log(sql)
    const res = await conn.execute(sql, q.parameters);
    // parse res to records...
    const records = [
        {'person__id': '111', 'person__name': 'leon'},
    ];
    // persons = [{ id: '111', name: 'leon', birthDay: undefined }]
    const persons = records.map(rec => schema.parse(rec, ['id', 'name']));
    console.log(persons);
})();
```
