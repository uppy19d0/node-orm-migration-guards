# knex-migration-guard

Knex and Objection.js adapter for `migration-guard-core`.

```js
import { createGuardedKnex } from "knex-migration-guard";

export async function up(knex) {
  const guarded = createGuardedKnex(knex);
  await guarded.schema.table("users", (table) => {
    table.dropColumn("email");
  });
}
```

The guarded Knex proxy checks raw SQL and common schema builder operations.

