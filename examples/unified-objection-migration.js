import { createMigrationGuard } from "node-orm-migration-guard/objection";

const guard = createMigrationGuard({
  database: "postgres"
});

export async function up(knex) {
  const db = guard.wrap(knex);

  await db.raw("ALTER TABLE users DROP COLUMN legacy_email");
}
