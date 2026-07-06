import { assertPrismaMigrationDirectory } from "prisma-migration-guard";

assertPrismaMigrationDirectory("prisma/migrations", {
  failOnWarnings: true,
  blockedTables: ["payments", "audit_logs"],
  blockedColumns: ["password_hash", "totp_secret"]
});

console.log("Prisma migrations passed safety checks.");

