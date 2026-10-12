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


## Supply-chain verification and runtime permissions

Runtime: migration-plan/SQL analysis and policy checks, with local migration-file reading in Prisma/Drizzle adapters. This is not a firewall for live ORM queries and cannot guarantee SQL-injection protection. Applications retain responsibility for parameterized queries, database credentials, authorization and explicit migration execution.

Install the exact version required by your application and commit your lockfile. Releases request npm provenance from GitHub Actions, and CI checks the dependency graph and package contents before publication. The artifact guard rejects recognized credential patterns, private/environment files, unsafe paths, missing attribution/metadata and unexpected consumer install hooks. It is a focused release check, not proof that every secret or malicious behavior is detectable.

```sh
npm install --save-exact drizzle-migration-guard@0.5.1
npm audit
npm audit signatures
```

When the installed graph has no registry dependencies, npm may report that there are no dependency signatures to verify.

Inspect the exact-version [Socket report](https://socket.dev/npm/package/drizzle-migration-guard/overview/0.5.1) and the npm provenance link. A successful CI check is not the same as a package score of 100. Socket also weighs dependency counts and real adoption; no score, download history or security guarantee is fabricated. Report suspected issues through SECURITY.md.
