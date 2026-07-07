import { createMigrationGuard } from "node-orm-migration-guard/mikro-orm";

const guard = createMigrationGuard({
  database: "postgres",
  allowDropColumn: ["users.legacy_email"]
});

export function createSafeMigration(migration) {
  return guard.wrapMigration(migration);
}
