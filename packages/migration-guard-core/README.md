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


## Bounded strict review (0.4.0)

Use `allowUnrecognized: false` to block raw SQL and unsupported operation types. Default limits are 1,000,000 SQL characters, 10,000 statements and 10,000 operations; positive safe-integer overrides are available. Malformed quotes/comments, executable comments and ambiguous backslash-escaped strings throw before execution. These helpers are migration policy checks, not a query sanitizer or database firewall. See the repository's `docs/security-performance.md` for compatibility and threat-model details.

Version 0.5.0 makes allowlists and ignore lists case-exact, preserves quoted whitespace/commas and decodes doubled identifier delimiters. Quoted dot or edge-space names require separate review. Prefer schema-qualified policies where scope matters.


## Supply-chain verification and runtime permissions

Runtime: migration-plan/SQL analysis and policy checks, with local migration-file reading in Prisma/Drizzle adapters. This is not a firewall for live ORM queries and cannot guarantee SQL-injection protection. Applications retain responsibility for parameterized queries, database credentials, authorization and explicit migration execution.

Install the exact version required by your application and commit your lockfile. Releases request npm provenance from GitHub Actions, and CI checks the dependency graph and package contents before publication. The artifact guard rejects recognized credential patterns, private/environment files, unsafe paths, missing attribution/metadata and unexpected consumer install hooks. It is a focused release check, not proof that every secret or malicious behavior is detectable.

```sh
npm install --save-exact migration-guard-core@0.5.1
npm audit
npm audit signatures
```

When the installed graph has no registry dependencies, npm may report that there are no dependency signatures to verify.

Inspect the exact-version [Socket report](https://socket.dev/npm/package/migration-guard-core/overview/0.5.1) and the npm provenance link. A successful CI check is not the same as a package score of 100. Socket also weighs dependency counts and real adoption; no score, download history or security guarantee is fabricated. Report suspected issues through SECURITY.md.
