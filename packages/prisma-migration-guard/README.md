# prisma-migration-guard

Prisma Migrate adapter for `migration-guard-core`.

```js
import { assertPrismaMigrationDirectory } from "prisma-migration-guard";

assertPrismaMigrationDirectory("prisma/migrations", {
  failOnWarnings: true
});
```

The directory helper scans Prisma `migration.sql` files.

