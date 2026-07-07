import { createMigrationGuard } from "node-orm-migration-guard/typeorm";

const guard = createMigrationGuard({
  database: "postgres",
  allowDropColumn: ["users.legacy_email"]
});

export class DropLegacyEmail1710000000000 {
  async up(queryRunner) {
    const guarded = guard.wrap(queryRunner);

    await guarded.query("ALTER TABLE users DROP COLUMN legacy_email");
  }
}
