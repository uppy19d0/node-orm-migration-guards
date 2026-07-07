import { createMigrationGuard } from "node-orm-migration-guard/typeorm";
import { DropLegacyEmail1710000000000 } from "./unified-typeorm-query-runner.js";

const guard = createMigrationGuard({
  database: "postgres",
  allowDropColumn: ["users.legacy_email"]
});

export const migration = guard.wrapMigration(new DropLegacyEmail1710000000000());
