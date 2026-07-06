# mikro-orm-migration-guard

MikroORM adapter for `migration-guard-core`.

```js
import { createGuardedMikroOrmMigration } from "mikro-orm-migration-guard";

const guarded = createGuardedMikroOrmMigration(migration);
await guarded.up();
```

The adapter wraps `addSql()` so generated SQL is checked before MikroORM stores or executes it.

