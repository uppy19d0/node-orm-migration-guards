import { createGuardedQueryRunner } from "typeorm-migration-guard";

export class GuardedExample1710000000000 {
  async up(queryRunner) {
    const guarded = createGuardedQueryRunner(queryRunner, {
      failOnWarnings: true,
      allowDropColumn: ["users.legacy_email"]
    });

    await guarded.query("ALTER TABLE users DROP COLUMN legacy_email");
  }
}

