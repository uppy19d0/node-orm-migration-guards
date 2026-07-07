import { createMigrationGuard } from "node-orm-migration-guard/sequelize";

const guard = createMigrationGuard({
  database: "mysql",
  failOnWarnings: true,
  allowDropColumn: ["users.legacy_email"]
});

export async function up(queryInterface) {
  const guarded = guard.wrap(queryInterface);

  await guarded.removeColumn("users", "legacy_email");
}
