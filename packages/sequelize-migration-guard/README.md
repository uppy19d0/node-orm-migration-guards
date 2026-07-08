# sequelize-migration-guard

Sequelize migration safety guard powered by `migration-guard-core`.

It wraps Sequelize `QueryInterface` calls and raw SQL execution before they reach the database.

## Installation

```sh
npm install sequelize-migration-guard
```

This package does not bundle Sequelize. It wraps a Sequelize QueryInterface that your application already provides.

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
