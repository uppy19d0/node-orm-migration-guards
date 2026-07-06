# drizzle-migration-guard

Drizzle adapter for `migration-guard-core`.

```js
import { assertDrizzleMigrationDirectory } from "drizzle-migration-guard";

assertDrizzleMigrationDirectory("drizzle", {
  failOnWarnings: true
});
```

The adapter can scan generated `.sql` migration files and can wrap a Drizzle database object to check SQL passed to `execute`, `run`, `all`, `get` or `values`.

