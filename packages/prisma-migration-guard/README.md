# prisma-migration-guard

Prisma Migrate safety guard powered by `migration-guard-core`.

It checks generated Prisma `migration.sql` files before deployment.

## Installation

```sh
npm install prisma-migration-guard
```

`prisma` is an optional peer dependency. This package does not bundle Prisma.

## CI Usage

```js
import { assertPrismaMigrationDirectory } from "prisma-migration-guard";

assertPrismaMigrationDirectory("prisma/migrations", {
  failOnWarnings: true,
  blockedTables: ["payments", "audit_logs"]
});
```

## Check One Migration

```js
import { assertPrismaMigrationFile } from "prisma-migration-guard";

assertPrismaMigrationFile("prisma/migrations/20260706010000_drop_email/migration.sql");
```

## API

| Export | Description |
| --- | --- |
| `guardPrismaMigrationSql(sql, options)` | Returns a structured result for SQL. |
| `assertPrismaMigrationSql(sql, options)` | Throws on unsafe SQL. |
| `readPrismaMigrationSql(fileOrDirectory)` | Reads a Prisma migration SQL file. |
| `guardPrismaMigrationFile(fileOrDirectory, options)` | Checks one `migration.sql`. |
| `assertPrismaMigrationFile(fileOrDirectory, options)` | Throws for one unsafe migration file. |
| `guardPrismaMigrationDirectory(directory, options)` | Checks all Prisma migration files in a directory. |
| `assertPrismaMigrationDirectory(directory, options)` | Throws when any migration in a directory fails. |

## License

MIT

