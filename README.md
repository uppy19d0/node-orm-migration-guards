# node-orm-migration-guards

[![CI](https://github.com/uppy19d0/node-orm-migration-guards/actions/workflows/ci.yml/badge.svg)](https://github.com/uppy19d0/node-orm-migration-guards/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/migration-guard-core.svg)](https://www.npmjs.com/package/migration-guard-core)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/node-%3E%3D18-brightgreen.svg)](package.json)

Migration safety guards for popular Node.js ORMs and migration tools.

`node-orm-migration-guards` helps catch destructive schema changes before they reach a database. The suite provides a unified package, a shared rule engine and small adapters for TypeORM, Prisma Migrate, Sequelize, Knex, Drizzle and MikroORM.

## Why Use It

Most migration incidents come from a short list of risky operations:

- dropping tables
- dropping columns
- truncating tables
- renaming tables or columns without a compatibility rollout
- adding `NOT NULL` columns without defaults on non-empty tables

This project makes those operations visible and enforceable. Errors are blocked by default, warnings are reported, and teams can explicitly allow known-safe exceptions.

## Packages

Use `node-orm-migration-guard` when you want one package and one configuration object. The ORM-specific packages remain available for applications that prefer a smaller direct adapter.

| Package | Use case |
| --- | --- |
| [`node-orm-migration-guard`](packages/node-orm-migration-guard) | Unified package configured with `orm` and `database` |
| [`migration-guard-core`](packages/migration-guard-core) | Shared SQL parser, rule engine and error types |
| [`typeorm-migration-guard`](packages/typeorm-migration-guard) | TypeORM `QueryRunner` and migration instance wrappers |
| [`prisma-migration-guard`](packages/prisma-migration-guard) | Prisma `migration.sql` file and directory checks |
| [`sequelize-migration-guard`](packages/sequelize-migration-guard) | Sequelize `QueryInterface` and raw query checks |
| [`knex-migration-guard`](packages/knex-migration-guard) | Knex raw SQL and schema builder checks |
| [`drizzle-migration-guard`](packages/drizzle-migration-guard) | Drizzle generated SQL files and database method wrappers |
| [`mikro-orm-migration-guard`](packages/mikro-orm-migration-guard) | MikroORM `addSql()` and migration lifecycle wrappers |

## Installation

Install the unified package for the recommended single-package API:

```sh
npm install node-orm-migration-guard
```

Install the core package when you only want to inspect SQL or custom migration operation objects directly:

```sh
npm install migration-guard-core
```

Install one adapter package for your ORM:

```sh
npm install typeorm-migration-guard
npm install prisma-migration-guard
npm install sequelize-migration-guard
npm install knex-migration-guard
npm install drizzle-migration-guard
npm install mikro-orm-migration-guard
```

The guards do not bundle TypeORM, Prisma, Sequelize, Knex, Drizzle or MikroORM. They wrap objects from the ORM already installed in your application, so the guard packages do not need ORM runtime dependencies.

## Quick Start

```js
import { createMigrationGuard } from "node-orm-migration-guard";

const guard = createMigrationGuard({
  orm: "drizzle",
  database: "postgres",
  failOnWarnings: true
});

guard.assertSql(`
  ALTER TABLE users DROP COLUMN email;
`);
```

The example throws a `MigrationGuardError` before the migration is allowed to continue.

Use `checkSql()` when you want a structured result instead of an exception:

```js
import { createMigrationGuard } from "node-orm-migration-guard";

const guard = createMigrationGuard({
  orm: "prisma",
  database: "postgres"
});

const result = guard.checkSql(`
  ALTER TABLE users ADD COLUMN status text NOT NULL;
`, {
  failOnWarnings: true
});

if (!result.passed) {
  console.error(result.violations);
  process.exit(1);
}
```

The package still exports the direct core helpers:

```js
import { assertSafeMigration } from "node-orm-migration-guard";

assertSafeMigration("DROP TABLE users;");
```

You can also import by ORM subpath:

```js
import { createMigrationGuard } from "node-orm-migration-guard/drizzle";

const guard = createMigrationGuard({
  database: "postgres",
  failOnWarnings: true
});

guard.assertDirectory("drizzle");
```

Available subpaths include `/drizzle`, `/prisma`, `/knex`, `/objection`, `/sequelize`, `/typeorm`, `/mikro-orm` and `/core`.

## Adapter Examples

### TypeORM

Wrap a `QueryRunner` before running SQL:

```js
import { createMigrationGuard } from "node-orm-migration-guard";

const guard = createMigrationGuard({
  orm: "typeorm",
  database: "postgres"
});

export class DropLegacyEmail1710000000000 {
  async up(queryRunner) {
    const guarded = guard.wrap(queryRunner);

    await guarded.query("ALTER TABLE users DROP COLUMN email");
  }
}
```

### Prisma Migrate

Check generated Prisma migration directories before deploy:

```js
import { createMigrationGuard } from "node-orm-migration-guard";

const guard = createMigrationGuard({
  orm: "prisma",
  database: "postgres"
});

guard.assertDirectory("prisma/migrations", {
  failOnWarnings: true
});
```

### Sequelize

Wrap `QueryInterface` in a migration:

```js
import { createMigrationGuard } from "node-orm-migration-guard";

const guard = createMigrationGuard({
  orm: "sequelize",
  database: "mysql"
});

export async function up(queryInterface) {
  const guarded = guard.wrap(queryInterface);

  await guarded.removeColumn("users", "email");
}
```

### Knex and Objection.js

Wrap the Knex instance passed to migrations:

```js
import { createMigrationGuard } from "node-orm-migration-guard";

const guard = createMigrationGuard({
  orm: "knex",
  database: "postgres"
});

export async function up(knex) {
  const guarded = guard.wrap(knex);

  await guarded.schema.table("users", (table) => {
    table.dropColumn("email");
  });
}
```

### Drizzle

Check generated SQL files:

```js
import { createMigrationGuard } from "node-orm-migration-guard";

const guard = createMigrationGuard({
  orm: "drizzle",
  database: "postgres"
});

guard.assertDirectory("drizzle", {
  failOnWarnings: true
});
```

Or wrap a Drizzle database object for direct execution checks:

```js
import { createMigrationGuard } from "node-orm-migration-guard";

const guard = createMigrationGuard({
  orm: "drizzle",
  database: "sqlite"
});

const guardedDb = guard.wrap(db);

await guardedDb.execute("TRUNCATE TABLE audit_logs");
```

### MikroORM

Wrap a migration instance so calls to `addSql()` are checked:

```js
import { createMigrationGuard } from "node-orm-migration-guard";

const guard = createMigrationGuard({
  orm: "mikro-orm",
  database: "postgres"
});

const guarded = guard.wrapMigration(migration);

await guarded.up();
```

## Rules

| Rule | Default severity | Trigger |
| --- | --- | --- |
| `dropTable` | `error` | `DROP TABLE ...` |
| `dropColumn` | `error` | `ALTER TABLE ... DROP COLUMN ...` |
| `truncateTable` | `error` | `TRUNCATE TABLE ...` |
| `renameTable` | `warning` | `ALTER TABLE ... RENAME TO ...` |
| `renameColumn` | `warning` | `ALTER TABLE ... RENAME COLUMN ... TO ...` |
| `addNotNullColumnWithoutDefault` | `warning` | `ADD COLUMN ... NOT NULL` without `DEFAULT` |
| `blockedTable` | `error` | Operation references a blocked table |
| `blockedColumn` | `error` | Operation references a blocked column |

Warnings do not fail a check unless `failOnWarnings` is enabled.

## Configuration

All adapters accept the same `MigrationGuardOptions` from `migration-guard-core`.

```js
import { assertSafeMigration } from "migration-guard-core";

assertSafeMigration(sql, {
  failOnWarnings: true,
  allowDropColumn: ["users.legacy_email"],
  allowRenameColumn: ["users.full_name"],
  blockedTables: ["payments", "audit_logs"],
  blockedColumns: ["password_hash"],
  severityOverrides: {
    renameTable: "error"
  }
});
```

Common options:

| Option | Purpose |
| --- | --- |
| `allowDropTable` | Allow specific table drops or all table drops with `true` |
| `allowDropColumn` | Allow specific column drops or all column drops with `true` |
| `allowTruncate` | Allow specific table truncates or all truncates with `true` |
| `allowRenameTable` | Allow specific table renames or all table renames with `true` |
| `allowRenameColumn` | Allow specific column renames or all column renames with `true` |
| `allowAddNotNullColumnWithoutDefault` | Allow specific `NOT NULL` column additions without defaults |
| `blockedTables` | Always flag operations touching these tables |
| `blockedColumns` | Always flag operations touching these columns |
| `ignoreTables` | Skip checks for specific tables |
| `ignoreColumns` | Skip checks for specific columns |
| `ignoredRules` | Disable rule IDs |
| `failOnWarnings` | Treat warnings as failing results |
| `severityOverrides` | Change a rule to `error`, `warning` or `off` |

Allow and block lists accept either plain object names such as `users` or qualified names such as `users.email`.

Detailed configuration guidance is available in [docs/configuration.md](docs/configuration.md).

## Core API

```js
import {
  MigrationGuardError,
  assertSafeMigration,
  checkMigration,
  createMigrationGuard,
  parseSqlMigration
} from "migration-guard-core";
```

Key exports:

| Export | Description |
| --- | --- |
| `checkMigration(input, options)` | Returns a `MigrationGuardResult` |
| `assertSafeMigration(input, options)` | Throws `MigrationGuardError` when the result fails |
| `createMigrationGuard(defaultOptions)` | Creates a reusable guard with shared defaults |
| `parseSqlMigration(sql)` | Converts SQL into normalized operation objects when possible |
| `splitSqlStatements(sql)` | Splits SQL while respecting quoted semicolons |
| `formatMigrationGuardMessage(result)` | Formats violations for logs or CI output |

`input` can be a SQL string or an array of normalized migration operations:

```js
import { assertSafeMigration } from "migration-guard-core";

assertSafeMigration([
  {
    type: "dropColumn",
    table: "users",
    column: "email"
  }
]);
```

## CI Usage

A typical CI guard can run after migrations are generated and before deploy:

```js
import { createMigrationGuard } from "node-orm-migration-guard";

const guard = createMigrationGuard({
  orm: "prisma",
  database: "postgres"
});

guard.assertDirectory("prisma/migrations", {
  failOnWarnings: true,
  blockedTables: ["payments", "audit_logs"]
});
```

For Drizzle:

```js
import { createMigrationGuard } from "node-orm-migration-guard";

const guard = createMigrationGuard({
  orm: "drizzle",
  database: "postgres"
});

guard.assertDirectory("drizzle", {
  failOnWarnings: true
});
```

See [docs/ci.md](docs/ci.md) for GitHub Actions examples and custom reporter patterns.

## Documentation

| Guide | Purpose |
| --- | --- |
| [Configuration](docs/configuration.md) | Options, allow lists, blocked objects and strict CI profiles |
| [Rules](docs/rules.md) | Rule behavior, severity and rollout guidance |
| [Adapters](docs/adapters.md) | ORM-specific usage patterns |
| [CI Integration](docs/ci.md) | Build pipeline examples |
| [Troubleshooting](docs/troubleshooting.md) | Common npm, workflow and parser issues |
| [Contributing](CONTRIBUTING.md) | Development workflow and project conventions |
| [Changelog](CHANGELOG.md) | Release history |

## Limitations

This project is a safety layer, not a full SQL compiler or a replacement for migration review.

- SQL parsing is intentionally focused on common migration statements.
- Raw SQL generated outside a wrapped API must be checked directly.
- Runtime wrappers only protect code paths that use the wrapped object.
- The guards cannot determine whether a destructive change is business-safe.
- Backups, staged deploys and database-specific rollback plans are still required for production systems.

## Development

```sh
npm install
npm test
npm run publish:check
npm pack --workspaces --dry-run
```

## Release and Publishing

This repository is a private npm workspace root that publishes each package independently. See [DEPLOY.md](DEPLOY.md) for the GitHub Actions release flow and local publish commands.

The npm publish order is dependency-safe:

1. `migration-guard-core`
2. adapter packages
3. `node-orm-migration-guard`

## Security

Please report suspected vulnerabilities privately. See [SECURITY.md](SECURITY.md).

## License

MIT. See [LICENSE](LICENSE).
