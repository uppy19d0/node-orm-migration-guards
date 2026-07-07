import { checkMigration } from "node-orm-migration-guard/core";

const result = checkMigration("ALTER TABLE users DROP COLUMN legacy_email;");

if (!result.passed) {
  for (const violation of result.violations) {
    console.error(`${violation.severity}: ${violation.message}`);
  }

  process.exit(1);
}

console.log("SQL passed migration guard checks.");
