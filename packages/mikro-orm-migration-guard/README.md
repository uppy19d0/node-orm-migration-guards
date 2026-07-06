# mikro-orm-migration-guard

MikroORM migration safety guard powered by `migration-guard-core`.

It wraps MikroORM migration instances and checks calls to `addSql()` before SQL is stored or executed.

## Installation

```sh
npm install mikro-orm-migration-guard
```

`@mikro-orm/core` and `@mikro-orm/migrations` are optional peer dependencies. This package does not bundle MikroORM.

## Usage

```js
import { createGuardedMikroOrmMigration } from "mikro-orm-migration-guard";

const guarded = createGuardedMikroOrmMigration(migration, {
  failOnWarnings: true
});

await guarded.up();
```

The wrapper guards direct `addSql()` calls and `addSql()` calls made inside synchronous or asynchronous `up()` and `down()` methods.

## API

| Export | Description |
| --- | --- |
| `createGuardedMikroOrmMigration(migration, options)` | Returns a guarded migration proxy. |
| `guardMikroOrmMigrationSql(sql, options)` | Returns a structured result for SQL. |
| `assertMikroOrmMigrationSql(sql, options)` | Throws on unsafe SQL. |

## License

MIT

