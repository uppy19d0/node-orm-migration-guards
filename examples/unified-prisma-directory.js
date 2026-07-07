import { createMigrationGuard } from "node-orm-migration-guard/prisma";

const guard = createMigrationGuard({
  database: "postgres",
  failOnWarnings: true,
  blockedTables: ["payments", "ledger_entries", "audit_logs"],
  blockedColumns: ["password_hash", "totp_secret", "api_key_hash"]
});

guard.assertDirectory("prisma/migrations");

console.log("Prisma migrations passed safety checks.");
