# Configuration

Every package in this suite accepts the same `MigrationGuardOptions` from `migration-guard-core`.

```js
const options = {
  failOnWarnings: true,
  allowDropColumn: ["users.legacy_email"],
  blockedTables: ["payments", "audit_logs"],
  severityOverrides: {
    renameTable: "error"
  }
};
```

## Strict CI Profile

Use this profile when checking generated migration files before deploy:

```js
export const migrationGuardOptions = {
  failOnWarnings: true,
  blockedTables: ["payments", "audit_logs", "ledger_entries"],
  blockedColumns: ["password_hash", "totp_secret", "api_key_hash"],
  severityOverrides: {
    renameTable: "error",
    renameColumn: "error"
  }
};
```

## Allowing Known-Safe Operations

Allow specific operations instead of disabling whole rules:

```js
assertSafeMigration(sql, {
  allowDropColumn: ["users.legacy_email"],
  allowDropTable: ["temporary_imports"],
  allowTruncate: ["staging_events"]
});
```

Qualified names are supported:

```js
allowDropColumn: ["public.users.legacy_email", "users.old_status"]
```

## Rule Overrides

Use `severityOverrides` when your team wants stricter or looser behavior:

```js
assertSafeMigration(sql, {
  severityOverrides: {
    renameColumn: "error",
    addNotNullColumnWithoutDefault: "off"
  }
});
```

Allowed override values are:

- `error`
- `warning`
- `warn`
- `off`
- `false`

## Ignoring Objects

Use ignore lists for tables or columns that are intentionally outside policy:

```js
assertSafeMigration(sql, {
  ignoreTables: ["scratchpad"],
  ignoreColumns: ["debug_notes"]
});
```

Prefer allow lists for one-time dangerous operations. Ignore lists are better for permanently unmanaged objects.

## Result Shape

`checkMigration()` returns:

```ts
interface MigrationGuardResult {
  passed: boolean;
  operations: MigrationOperation[];
  violations: MigrationViolation[];
  hasErrors: boolean;
  hasWarnings: boolean;
}
```

Use `assertSafeMigration()` when failure should throw, and `checkMigration()` when a build tool or custom reporter needs structured output.

