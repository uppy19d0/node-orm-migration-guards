import { createMigrationGuard } from "node-orm-migration-guard/drizzle";

const guard = createMigrationGuard({
  database: "postgres",
  failOnWarnings: true,
  blockedTables: ["payments", "audit_logs"]
});

guard.assertDirectory("drizzle");

console.log("Drizzle migrations passed safety checks.");
