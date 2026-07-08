# drizzle-migration-guard

Drizzle migration safety guard powered by `migration-guard-core`.

It checks generated Drizzle SQL migration files and can wrap database execution helpers.

## Installation

```sh
npm install drizzle-migration-guard
```

This package does not bundle Drizzle. It wraps a Drizzle database object that your application already provides.

## Check Generated Migrations

```js
import { assertDrizzleMigrationDirectory } from "drizzle-migration-guard";

assertDrizzleMigrationDirectory("drizzle", {
  failOnWarnings: true
});
```

## Guard Direct Execution

```js
import { createGuardedDrizzle } from "drizzle-migration-guard";

const guardedDb = createGuardedDrizzle(db);

await guardedDb.execute("TRUNCATE TABLE audit_logs");
```

## Guarded Database Methods

- `execute()`
- `run()`
- `all()`
- `get()`
- `values()`

## API

| Export | Description |
| --- | --- |
| `createGuardedDrizzle(database, options)` | Returns a guarded Drizzle database proxy. |
| `guardDrizzleMigrationDirectory(directory, options)` | Checks generated `.sql` migration files. |
| `assertDrizzleMigrationDirectory(directory, options)` | Throws when generated migrations fail. |
| `guardDrizzleMigrationFile(file, options)` | Checks one SQL file. |
| `assertDrizzleMigrationFile(file, options)` | Throws for one unsafe file. |
| `guardDrizzleMigrationSql(sql, options)` | Returns a structured result for SQL. |
| `assertDrizzleMigrationSql(sql, options)` | Throws on unsafe SQL. |
| `extractDrizzleSqlText(input)` | Extracts SQL text from common Drizzle SQL objects. |

## License

MIT
