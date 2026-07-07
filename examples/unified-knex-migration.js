import { createMigrationGuard } from "node-orm-migration-guard/knex";

const guard = createMigrationGuard({
  database: "postgres",
  allowDropColumn: ["users.legacy_email"]
});

export async function up(knex) {
  const db = guard.wrap(knex);

  await db.schema.table("users", (table) => {
    table.dropColumn("legacy_email");
  });
}

export async function down(knex) {
  await knex.schema.table("users", (table) => {
    table.text("legacy_email");
  });
}
