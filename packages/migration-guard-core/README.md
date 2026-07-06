# migration-guard-core

Shared migration safety rule engine for Node.js database migration guards.

Use this package directly when you want to inspect SQL strings or normalized migration operation objects without tying the check to a specific ORM.

## Installation

```sh
npm install migration-guard-core
```

## Quick Start

```js
import { assertSafeMigration } from "migration-guard-core";

assertSafeMigration(`
  ALTER TABLE users DROP COLUMN email;
`);
```

The example throws `MigrationGuardError` because dropping a column is destructive.

Use `checkMigration()` for structured output:

```js
import { checkMigration } from "migration-guard-core";

const result = checkMigration("ALTER TABLE users ADD COLUMN status text NOT NULL", {
  failOnWarnings: true
});

if (!result.passed) {
  console.error(result.violations);
}
```

## Rules

| Rule | Default severity |
| --- | --- |
| `dropTable` | `error` |
| `dropColumn` | `error` |
| `truncateTable` | `error` |
| `renameTable` | `warning` |
| `renameColumn` | `warning` |
| `addNotNullColumnWithoutDefault` | `warning` |
| `blockedTable` | `error` |
| `blockedColumn` | `error` |

## Configuration

```js
assertSafeMigration(sql, {
  failOnWarnings: true,
  allowDropColumn: ["users.legacy_email"],
  blockedTables: ["payments", "audit_logs"],
  blockedColumns: ["password_hash"],
  severityOverrides: {
    renameColumn: "error"
  }
});
```

## API

| Export | Description |
| --- | --- |
| `checkMigration(input, options)` | Returns a structured result. |
| `assertSafeMigration(input, options)` | Throws when the result fails. |
| `createMigrationGuard(defaultOptions)` | Creates a reusable guard. |
| `parseSqlMigration(sql)` | Parses common migration SQL into operations. |
| `splitSqlStatements(sql)` | Splits SQL while respecting quoted semicolons. |
| `formatMigrationGuardMessage(result)` | Formats violations for logs. |
| `MigrationGuardError` | Error thrown by assert helpers. |

## Related Packages

Adapters are available for TypeORM, Prisma Migrate, Sequelize, Knex, Drizzle and MikroORM.

## License

MIT

