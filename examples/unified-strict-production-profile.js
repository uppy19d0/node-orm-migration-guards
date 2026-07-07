import { createMigrationGuard } from "node-orm-migration-guard/prisma";

export const migrationGuard = createMigrationGuard({
  database: "postgres",
  failOnWarnings: true,
  blockedTables: ["payments", "ledger_entries", "audit_logs"],
  blockedColumns: ["password_hash", "totp_secret", "api_key_hash"],
  severityOverrides: {
    renameTable: "error",
    renameColumn: "error"
  }
});
