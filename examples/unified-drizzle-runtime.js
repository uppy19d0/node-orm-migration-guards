import { createMigrationGuard } from "node-orm-migration-guard/drizzle";

const guard = createMigrationGuard({
  database: "sqlite",
  allowTruncate: ["scratch_events"]
});

export function createSafeDb(db) {
  return guard.wrap(db);
}
