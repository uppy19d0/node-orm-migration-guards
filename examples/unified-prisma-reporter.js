import { createMigrationGuard } from "node-orm-migration-guard/prisma";

const guard = createMigrationGuard({
  database: "postgres",
  failOnWarnings: true
});

const result = guard.checkDirectory("prisma/migrations");

if (!result.passed) {
  for (const violation of result.violations) {
    console.error(`${violation.source || "migration"}: ${violation.message}`);
  }

  process.exit(1);
}

console.log(`Checked ${result.files.length} Prisma migration file(s).`);
