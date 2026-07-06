# typeorm-migration-guard

TypeORM adapter for `migration-guard-core`.

```js
import { createGuardedQueryRunner } from "typeorm-migration-guard";

export class MyMigration1710000000000 {
  async up(queryRunner) {
    const guarded = createGuardedQueryRunner(queryRunner);
    await guarded.query("ALTER TABLE users DROP COLUMN email");
  }
}
```

The guarded query runner checks SQL before it is sent to TypeORM.

