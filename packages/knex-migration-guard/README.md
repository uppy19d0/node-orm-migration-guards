# knex-migration-guard

Knex and Objection.js migration safety guard powered by `migration-guard-core`.

It wraps Knex raw SQL and common schema builder operations before they execute.

## Installation

```sh
npm install knex-migration-guard
```

`knex` is an optional peer dependency. This package does not bundle Knex or Objection.js.

## Usage

```js
import { createGuardedKnex } from "knex-migration-guard";

export async function up(knex) {
  const guarded = createGuardedKnex(knex, {
    failOnWarnings: true
  });

  await guarded.schema.table("users", (table) => {
    table.dropColumn("email");
  });
}
```

## Guarded Operations

- `knex.raw()`
- `knex.schema.raw()`
- `knex.schema.dropTable()`
- `knex.schema.dropTableIfExists()`
- `knex.schema.renameTable()`
- `table.dropColumn()`
- `table.dropColumns()`
- `table.renameColumn()`

## API

| Export | Description |
| --- | --- |
| `createGuardedKnex(knex, options)` | Returns a guarded Knex proxy. |
| `guardKnexMigrationSql(sql, options)` | Returns a structured result for SQL. |
| `assertKnexMigrationSql(sql, options)` | Throws on unsafe SQL. |

## License

MIT

