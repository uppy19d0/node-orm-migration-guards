# node-orm-migration-guards

Safety guards for database migrations in popular Node.js ORMs and migration tools.

The suite is split into independent npm packages:

| Package | ORM / tool |
| --- | --- |
| `migration-guard-core` | Shared rule engine |
| `typeorm-migration-guard` | TypeORM |
| `prisma-migration-guard` | Prisma Migrate |
| `sequelize-migration-guard` | Sequelize |
| `knex-migration-guard` | Knex / Objection.js |
| `drizzle-migration-guard` | Drizzle |
| `mikro-orm-migration-guard` | MikroORM |

## Why

Production migration failures are often caused by a small set of dangerous operations: dropping tables, dropping columns, truncating data, renaming objects without an explicit rollout plan, or adding `NOT NULL` columns without defaults.

This project gives every adapter the same core behavior:

- parse SQL migration text when possible
- inspect migration operations before they execute
- fail on destructive changes by default
- allow specific dangerous changes explicitly
- report warnings for risky but sometimes valid changes

## Quick start

```js
import { assertSafeMigration } from "migration-guard-core";

assertSafeMigration(`
  ALTER TABLE users ADD COLUMN status text NOT NULL;
`, {
  failOnWarnings: true
});
```

```js
import { createGuardedQueryRunner } from "typeorm-migration-guard";

export class AddStatus1710000000000 {
  async up(queryRunner) {
    const guardedQueryRunner = createGuardedQueryRunner(queryRunner);
    await guardedQueryRunner.query("ALTER TABLE users DROP COLUMN email");
  }
}
```

The example above throws a `MigrationGuardError` before the SQL is executed.

## Development

```sh
npm install
npm test
```

## Publishing

Each package is configured as a separate public npm package.

```sh
npm run pack:all
npm run publish:all
```

