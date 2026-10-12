# sequelize-migration-guard

Sequelize migration safety guard powered by `migration-guard-core`.

It wraps Sequelize `QueryInterface` calls and raw SQL execution before they reach the database.

## Installation

```sh
npm install sequelize-migration-guard
```

This package does not bundle Sequelize. It wraps a Sequelize QueryInterface that your application already provides.

## Usage

```js
import { createGuardedQueryInterface } from "sequelize-migration-guard";

export async function up(queryInterface) {
  const guarded = createGuardedQueryInterface(queryInterface, {
    failOnWarnings: true
  });

  await guarded.removeColumn("users", "email");
}
```

## Guarded Operations

- `dropTable()`
- `removeColumn()`
- `renameTable()`
- `renameColumn()`
- `queryInterface.sequelize.query()`

## API

| Export | Description |
| --- | --- |
| `createGuardedQueryInterface(queryInterface, options)` | Returns a guarded QueryInterface proxy. |
| `guardSequelizeMigrationSql(sql, options)` | Returns a structured result for SQL. |
| `assertSequelizeMigrationSql(sql, options)` | Throws on unsafe SQL. |

## License

MIT


## Supply-chain verification and runtime permissions

Runtime: migration-plan/SQL analysis and policy checks, with local migration-file reading in Prisma/Drizzle adapters. This is not a firewall for live ORM queries and cannot guarantee SQL-injection protection. Applications retain responsibility for parameterized queries, database credentials, authorization and explicit migration execution.

Install the exact version required by your application and commit your lockfile. Releases request npm provenance from GitHub Actions, and CI checks the dependency graph and package contents before publication. The artifact guard rejects recognized credential patterns, private/environment files, unsafe paths, missing attribution/metadata and unexpected consumer install hooks. It is a focused release check, not proof that every secret or malicious behavior is detectable.

```sh
npm install --save-exact sequelize-migration-guard@0.5.1
npm audit
npm audit signatures
```

When the installed graph has no registry dependencies, npm may report that there are no dependency signatures to verify.

Inspect the exact-version [Socket report](https://socket.dev/npm/package/sequelize-migration-guard/overview/0.5.1) and the npm provenance link. A successful CI check is not the same as a package score of 100. Socket also weighs dependency counts and real adoption; no score, download history or security guarantee is fabricated. Report suspected issues through SECURITY.md.
