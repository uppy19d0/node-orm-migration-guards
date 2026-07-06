# sequelize-migration-guard

Sequelize adapter for `migration-guard-core`.

```js
import { createGuardedQueryInterface } from "sequelize-migration-guard";

export async function up(queryInterface) {
  const guarded = createGuardedQueryInterface(queryInterface);
  await guarded.removeColumn("users", "email");
}
```

The proxy checks destructive QueryInterface calls and raw SQL before they execute.

