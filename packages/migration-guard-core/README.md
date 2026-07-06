# migration-guard-core

Shared rule engine used by the ORM-specific migration guard packages.

```js
import { checkMigration, assertSafeMigration } from "migration-guard-core";

const result = checkMigration("ALTER TABLE users DROP COLUMN email");

assertSafeMigration("DROP TABLE users", {
  allowDropTable: ["users"]
});
```

By default, the core engine blocks table drops, column drops and truncates. It reports warnings for table renames, column renames and new `NOT NULL` columns without defaults.

