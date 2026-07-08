# node-orm-migration-guard

Unified migration safety guard for popular Node.js ORMs and migration tools.

Use this package when you want one import and one configuration object instead of installing an ORM-specific guard directly.

## Installation

```sh
npm install node-orm-migration-guard
```

ORM packages such as `drizzle-orm`, `knex`, `prisma`, `sequelize`, `typeorm` and MikroORM are not dependencies of this package. Install only the ORM you actually use in your application.

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

## Subpath Imports

Use subpaths when you want the import itself to name the ORM:

```js
import { createMigrationGuard } from "node-orm-migration-guard/drizzle";

const guard = createMigrationGuard({
  database: "postgres",
  failOnWarnings: true
});

guard.assertDirectory("drizzle");
```

Available subpaths:

```js
import { createMigrationGuard as createDrizzleGuard } from "node-orm-migration-guard/drizzle";
import { createMigrationGuard as createPrismaGuard } from "node-orm-migration-guard/prisma";
import { createMigrationGuard as createKnexGuard } from "node-orm-migration-guard/knex";
import { createMigrationGuard as createObjectionGuard } from "node-orm-migration-guard/objection";
import { createMigrationGuard as createSequelizeGuard } from "node-orm-migration-guard/sequelize";
import { createMigrationGuard as createTypeOrmGuard } from "node-orm-migration-guard/typeorm";
import { createMigrationGuard as createMikroOrmGuard } from "node-orm-migration-guard/mikro-orm";
```

The core engine is also available directly:

```js
import { assertSafeMigration } from "node-orm-migration-guard/core";

assertSafeMigration("ALTER TABLE users DROP COLUMN legacy_email;");
```

## Examples

### Drizzle Directory Check

```js
import { createMigrationGuard } from "node-orm-migration-guard/drizzle";

const guard = createMigrationGuard({
  database: "postgres",
  failOnWarnings: true
});

guard.assertDirectory("drizzle");
```

### Drizzle Runtime SQL Guard

```js
import { createMigrationGuard } from "node-orm-migration-guard/drizzle";

const guard = createMigrationGuard({
  database: "sqlite"
});

const guardedDb = guard.wrap(db);

await guardedDb.execute("TRUNCATE TABLE audit_logs");
```

### Prisma Directory Check

```js
import { createMigrationGuard } from "node-orm-migration-guard/prisma";

const guard = createMigrationGuard({
  database: "postgres",
  failOnWarnings: true,
  blockedTables: ["payments", "ledger_entries"]
});

guard.assertDirectory("prisma/migrations");
```

### Prisma Single Migration File

```js
import { createMigrationGuard } from "node-orm-migration-guard/prisma";

const guard = createMigrationGuard({
  database: "postgres"
});

const result = guard.checkFile("prisma/migrations/20260707010101_init/migration.sql");

if (!result.passed) {
  console.error(result.violations);
  process.exit(1);
}
```

### Knex Migration Wrapper

```js
import { createMigrationGuard } from "node-orm-migration-guard/knex";

const guard = createMigrationGuard({
  database: "postgres",
  allowDropColumn: ["users.legacy_email"]
});

export async function up(knex) {
  const db = guard.wrap(knex);

  await db.schema.table("users", (table) => {
    table.dropColumn("legacy_email");
  });
}
```

### Objection.js Alias

```js
import { createMigrationGuard } from "node-orm-migration-guard/objection";

const guard = createMigrationGuard({
  database: "postgres"
});

export async function up(knex) {
  const db = guard.wrap(knex);

  await db.raw("ALTER TABLE users DROP COLUMN legacy_email");
}
```

### Sequelize QueryInterface Wrapper

```js
import { createMigrationGuard } from "node-orm-migration-guard/sequelize";

const guard = createMigrationGuard({
  database: "mysql",
  failOnWarnings: true
});

export async function up(queryInterface) {
  const guarded = guard.wrap(queryInterface);

  await guarded.removeColumn("users", "legacy_email");
}
```

### TypeORM QueryRunner Wrapper

```js
import { createMigrationGuard } from "node-orm-migration-guard/typeorm";

const guard = createMigrationGuard({
  database: "postgres"
});

export class DropLegacyEmail1710000000000 {
  async up(queryRunner) {
    const guarded = guard.wrap(queryRunner);

    await guarded.query("ALTER TABLE users DROP COLUMN legacy_email");
  }
}
```

### TypeORM Migration Instance Wrapper

```js
import { createMigrationGuard } from "node-orm-migration-guard/typeorm";

const guard = createMigrationGuard({
  database: "postgres",
  allowDropColumn: ["users.legacy_email"]
});

const migration = guard.wrapMigration(new DropLegacyEmail1710000000000());

await migration.up(queryRunner);
```

### MikroORM Migration Wrapper

```js
import { createMigrationGuard } from "node-orm-migration-guard/mikro-orm";

const guard = createMigrationGuard({
  database: "postgres",
  failOnWarnings: true
});

const guarded = guard.wrapMigration(migration);

await guarded.up();
```

### Core SQL Check

```js
import { checkMigration } from "node-orm-migration-guard/core";

const result = checkMigration("ALTER TABLE users DROP COLUMN legacy_email");

if (!result.passed) {
  for (const violation of result.violations) {
    console.error(`${violation.severity}: ${violation.message}`);
  }
}
```

### Custom CI Reporter

```js
import { createMigrationGuard } from "node-orm-migration-guard/prisma";

const guard = createMigrationGuard({
  database: "postgres",
  failOnWarnings: true,
  blockedTables: ["payments", "audit_logs"],
  blockedColumns: ["password_hash", "totp_secret"]
});

const result = guard.checkDirectory("prisma/migrations");

if (!result.passed) {
  for (const violation of result.violations) {
    console.error(`${violation.source || "migration"}: ${violation.message}`);
  }

  process.exit(1);
}
```

### Allow Known-Safe Changes

```js
import { createMigrationGuard } from "node-orm-migration-guard/drizzle";

const guard = createMigrationGuard({
  database: "postgres",
  allowDropColumn: ["users.legacy_email"],
  allowRenameColumn: ["users.full_name"],
  allowTruncate: ["staging_imports"]
});

guard.assertDirectory("drizzle");
```

### Strict Production Profile

```js
import { createMigrationGuard } from "node-orm-migration-guard/prisma";

export const migrationGuard = createMigrationGuard({
  database: "postgres",
  failOnWarnings: true,
  blockedTables: ["payments", "ledger_entries", "audit_logs"],
  blockedColumns: ["password_hash", "totp_secret", "api_key_hash"],
  severityOverrides: {
    renameTable: "error",
    renameColumn: "error"
  }
});
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
