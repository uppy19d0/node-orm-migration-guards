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
