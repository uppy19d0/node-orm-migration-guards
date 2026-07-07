# CI Integration

Migration guards work best when they run before deployment. The checks should fail the build if a migration includes destructive or risky operations that were not explicitly approved.

## GitHub Actions Example

```yaml
name: Migration Guard

on:
  pull_request:
  push:
    branches:
      - main

jobs:
  migrations:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 20

      - run: npm ci
      - run: node scripts/check-migrations.js
```

## Prisma Example

```js
import { createMigrationGuard } from "node-orm-migration-guard";

const guard = createMigrationGuard({
  orm: "prisma",
  database: "postgres"
});

guard.assertDirectory("prisma/migrations", {
  failOnWarnings: true,
  blockedTables: ["payments", "audit_logs"]
});
```

## Drizzle Example

```js
import { createMigrationGuard } from "node-orm-migration-guard";

const guard = createMigrationGuard({
  orm: "drizzle",
  database: "postgres"
});

guard.assertDirectory("drizzle", {
  failOnWarnings: true
});
```

## Exit Codes

`assert*` helpers throw `MigrationGuardError`. In Node scripts, an uncaught error exits with a non-zero code and fails CI.

Use `check*` helpers when you want custom formatting:

```js
import { createMigrationGuard } from "node-orm-migration-guard";

const guard = createMigrationGuard({
  orm: "prisma",
  database: "postgres"
});

const result = guard.checkDirectory("prisma/migrations");

if (!result.passed) {
  for (const violation of result.violations) {
    console.error(`${violation.severity}: ${violation.message}`);
  }

  process.exit(1);
}
```
