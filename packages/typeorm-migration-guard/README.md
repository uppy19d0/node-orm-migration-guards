# typeorm-migration-guard

TypeORM migration safety guard powered by `migration-guard-core`.

It wraps TypeORM `QueryRunner` objects and checks raw SQL before it is executed.

## Installation

```sh
npm install typeorm-migration-guard
```

This package does not bundle TypeORM. It wraps a TypeORM QueryRunner or migration instance that your application already provides.

## Usage

```js
import { createGuardedQueryRunner } from "typeorm-migration-guard";

export class DropLegacyEmail1710000000000 {
  async up(queryRunner) {
    const guarded = createGuardedQueryRunner(queryRunner, {
      failOnWarnings: true
    });

    await guarded.query("ALTER TABLE users DROP COLUMN email");
  }
}
```

The query above throws before TypeORM sends SQL to the database.

## Allow a Reviewed Change

```js
const guarded = createGuardedQueryRunner(queryRunner, {
  allowDropColumn: ["users.legacy_email"]
});
```

## API

| Export | Description |
| --- | --- |
| `createGuardedQueryRunner(queryRunner, options)` | Returns a proxy that guards `query()`. |
| `guardTypeOrmMigrationInstance(migration, options)` | Wraps a migration instance and guards `up()`. |
| `guardTypeOrmMigrationSql(sql, options)` | Returns a structured result for SQL. |
| `assertTypeOrmMigrationSql(sql, options)` | Throws on unsafe SQL. |

## License

MIT


## Supply-chain verification and runtime permissions

Runtime: migration-plan/SQL analysis and policy checks, with local migration-file reading in Prisma/Drizzle adapters. This is not a firewall for live ORM queries and cannot guarantee SQL-injection protection. Applications retain responsibility for parameterized queries, database credentials, authorization and explicit migration execution.

Install the exact version required by your application and commit your lockfile. Releases request npm provenance from GitHub Actions, and CI checks the dependency graph and package contents before publication. The artifact guard rejects recognized credential patterns, private/environment files, unsafe paths, missing attribution/metadata and unexpected consumer install hooks. It is a focused release check, not proof that every secret or malicious behavior is detectable.

```sh
npm install --save-exact typeorm-migration-guard@0.5.1
npm audit
npm audit signatures
```

When the installed graph has no registry dependencies, npm may report that there are no dependency signatures to verify.

Inspect the exact-version [Socket report](https://socket.dev/npm/package/typeorm-migration-guard/overview/0.5.1) and the npm provenance link. A successful CI check is not the same as a package score of 100. Socket also weighs dependency counts and real adoption; no score, download history or security guarantee is fabricated. Report suspected issues through SECURITY.md.
