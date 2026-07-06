# Rules

The core rule engine reports violations with a `ruleId`, severity, message, source, table, column and normalized operation.

## Default Rules

| Rule | Severity | Why it matters |
| --- | --- | --- |
| `dropTable` | `error` | Permanently removes an object and all data in it. |
| `dropColumn` | `error` | Permanently removes data and can break older application versions. |
| `truncateTable` | `error` | Deletes all rows without row-by-row review. |
| `renameTable` | `warning` | Can break rolling deploys and older application versions. |
| `renameColumn` | `warning` | Can break rolling deploys and older application versions. |
| `addNotNullColumnWithoutDefault` | `warning` | Can fail on non-empty tables or lock large tables. |
| `blockedTable` | `error` | Enforces team policy for sensitive tables. |
| `blockedColumn` | `error` | Enforces team policy for sensitive columns. |

## Recommended Rollout Patterns

### Dropping a Column

1. Stop reading the column in application code.
2. Deploy.
3. Stop writing the column.
4. Deploy again.
5. Confirm no old application instances are running.
6. Drop the column with an explicit allow list entry.

### Renaming a Column

Prefer expand and contract:

1. Add the new column.
2. Backfill data.
3. Dual-write old and new columns.
4. Read from the new column.
5. Stop using the old column.
6. Drop the old column in a later deploy.

### Adding a NOT NULL Column

Prefer:

1. Add the column as nullable.
2. Backfill in batches.
3. Add a default if appropriate.
4. Add the `NOT NULL` constraint after data is valid.

## SQL Parser Scope

The parser intentionally focuses on common migration statements:

- `DROP TABLE`
- `TRUNCATE TABLE`
- `ALTER TABLE ... DROP COLUMN`
- `ALTER TABLE ... RENAME TO`
- `ALTER TABLE ... RENAME COLUMN ... TO`
- `ALTER TABLE ... ADD COLUMN`

Unknown SQL is represented as `rawSql` and is not blocked unless an adapter supplies structured operations.

