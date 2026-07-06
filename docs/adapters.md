# Adapter Guide

Each adapter exposes two kinds of helpers:

- direct SQL helpers, such as `assertKnexMigrationSql(sql, options)`
- ORM wrappers, such as `createGuardedKnex(knex, options)`

## TypeORM

Use `createGuardedQueryRunner()` when migrations call `queryRunner.query()`.

```js
import { createGuardedQueryRunner } from "typeorm-migration-guard";

export class Example1710000000000 {
  async up(queryRunner) {
    const guarded = createGuardedQueryRunner(queryRunner, {
      failOnWarnings: true
    });

    await guarded.query("ALTER TABLE users DROP COLUMN legacy_email");
  }
}
```

## Prisma Migrate

Use directory checks in CI after `prisma migrate diff` or after migration files are generated.

```js
import { assertPrismaMigrationDirectory } from "prisma-migration-guard";

assertPrismaMigrationDirectory("prisma/migrations", {
  failOnWarnings: true
});
```

## Sequelize

Use `createGuardedQueryInterface()` inside migrations.

```js
import { createGuardedQueryInterface } from "sequelize-migration-guard";

export async function up(queryInterface) {
  const guarded = createGuardedQueryInterface(queryInterface);
  await guarded.removeColumn("users", "legacy_email");
}
```

## Knex and Objection.js

Use `createGuardedKnex()` on the Knex instance passed into migrations.

```js
import { createGuardedKnex } from "knex-migration-guard";

export async function up(knex) {
  const guarded = createGuardedKnex(knex);

  await guarded.schema.table("users", (table) => {
    table.dropColumn("legacy_email");
  });
}
```

## Drizzle

Use file checks for generated SQL migrations:

```js
import { assertDrizzleMigrationDirectory } from "drizzle-migration-guard";

assertDrizzleMigrationDirectory("drizzle", {
  failOnWarnings: true
});
```

Use `createGuardedDrizzle()` for direct SQL execution helpers:

```js
import { createGuardedDrizzle } from "drizzle-migration-guard";

const guardedDb = createGuardedDrizzle(db);
await guardedDb.execute("TRUNCATE TABLE audit_logs");
```

## MikroORM

Use `createGuardedMikroOrmMigration()` to guard `addSql()` calls across synchronous and asynchronous lifecycle methods.

```js
import { createGuardedMikroOrmMigration } from "mikro-orm-migration-guard";

const guarded = createGuardedMikroOrmMigration(migration);
await guarded.up();
```

