# sequelize-migration-guard

Sequelize migration safety guard powered by `migration-guard-core`.

It wraps Sequelize `QueryInterface` calls and raw SQL execution before they reach the database.

## Installation

```sh
npm install sequelize-migration-guard
```

`sequelize` is an optional peer dependency. This package does not bundle Sequelize.

## Usage

```js
import { createGuardedQueryInterface } from "sequelize-migration-guard";

export async function up(queryInterface) {
  const guarded = createGuardedQueryInterface(queryInterface, {
    failOnWarnings: true
  });

  await guarded.removeColumn("users", "email");
}
```

## Guarded Operations

- `dropTable()`
- `removeColumn()`
- `renameTable()`
- `renameColumn()`
- `queryInterface.sequelize.query()`

## API

| Export | Description |
| --- | --- |
| `createGuardedQueryInterface(queryInterface, options)` | Returns a guarded QueryInterface proxy. |
| `guardSequelizeMigrationSql(sql, options)` | Returns a structured result for SQL. |
| `assertSequelizeMigrationSql(sql, options)` | Throws on unsafe SQL. |

## License

MIT

