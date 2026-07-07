# node-orm-migration-guard

Unified migration safety guard for popular Node.js ORMs and migration tools.

Use this package when you want one import and one configuration object instead of installing an ORM-specific guard directly.

## Installation

```sh
npm install node-orm-migration-guard
```

ORM packages such as `drizzle-orm`, `knex`, `prisma`, `sequelize`, `typeorm` and MikroORM remain optional peer dependencies. Install only the ORM you actually use.

## Quick Start

```js
import { createMigrationGuard } from "node-orm-migration-guard";

const guard = createMigrationGuard({
  orm: "drizzle",
  database: "postgres",
  failOnWarnings: true
});

guard.assertDirectory("drizzle");
```

## Runtime Wrappers

```js
import { createMigrationGuard } from "node-orm-migration-guard";

const guard = createMigrationGuard({
  orm: "knex",
  database: "postgresql"
});

export async function up(knex) {
  const db = guard.wrap(knex);

  await db.schema.table("users", (table) => {
    table.dropColumn("legacy_email");
  });
}
```

## Supported ORMs

| ORM | SQL checks | File checks | Directory checks | Runtime wrapper |
| --- | --- | --- | --- | --- |
| Drizzle | Yes | Yes | Yes | Yes |
| Knex / Objection.js | Yes | No | No | Yes |
| MikroORM | Yes | No | No | Yes |
| Prisma Migrate | Yes | Yes | Yes | No |
| Sequelize | Yes | No | No | Yes |
| TypeORM | Yes | No | No | Yes |

Supported `orm` values include aliases such as `drizzle-orm`, `objection`, `mikroorm`, `prisma-migrate` and `type-orm`.

## API

```js
const guard = createMigrationGuard({
  orm: "typeorm",
  database: "postgres",
  failOnWarnings: true
});

guard.checkSql(sql);
guard.assertSql(sql);
guard.check(sqlOrOperations);
guard.assert(sqlOrOperations);
guard.checkFile(file);
guard.assertFile(file);
guard.checkDirectory(directory);
guard.assertDirectory(directory);
guard.wrap(queryRunnerOrDatabase);
guard.wrapMigration(migration);
```

The package also re-exports the core API and the ORM-specific helpers for users who want the old direct functions from the same package.

## License

MIT
