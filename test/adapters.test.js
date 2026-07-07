import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { MigrationGuardError } from "migration-guard-core";
import { createGuardedDrizzle } from "drizzle-migration-guard";
import { createGuardedKnex } from "knex-migration-guard";
import { createGuardedMikroOrmMigration } from "mikro-orm-migration-guard";
import { createMigrationGuard as createUnifiedMigrationGuard, getSupportedOrms } from "node-orm-migration-guard";
import { guardPrismaMigrationFile } from "prisma-migration-guard";
import { createGuardedQueryInterface } from "sequelize-migration-guard";
import { createGuardedQueryRunner } from "typeorm-migration-guard";

test("TypeORM query runner proxy rejects destructive raw SQL", () => {
  const queryRunner = {
    query(sql) {
      return Promise.resolve(sql);
    }
  };

  const guarded = createGuardedQueryRunner(queryRunner);

  assert.throws(
    () => guarded.query("DROP TABLE users;"),
    MigrationGuardError
  );
});

test("Prisma file helper checks migration.sql files", () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "prisma-migration-guard-"));
  const file = path.join(directory, "migration.sql");
  fs.writeFileSync(file, "ALTER TABLE users DROP COLUMN email;", "utf8");

  const result = guardPrismaMigrationFile(file);

  assert.equal(result.passed, false);
  assert.equal(result.violations[0].source, file);
});

test("Sequelize query interface proxy rejects removeColumn", () => {
  const queryInterface = {
    removeColumn() {
      return "removed";
    }
  };

  const guarded = createGuardedQueryInterface(queryInterface);

  assert.throws(
    () => guarded.removeColumn("users", "email"),
    MigrationGuardError
  );
});

test("Knex proxy rejects schema table dropColumn", () => {
  function knex() {
    return {};
  }

  knex.raw = (sql) => ({ sql });
  knex.schema = {
    table(tableName, callback) {
      const tableBuilder = {
        dropColumn(columnName) {
          return { tableName, columnName };
        }
      };
      callback(tableBuilder);
      return { tableName };
    }
  };

  const guarded = createGuardedKnex(knex);

  assert.throws(
    () => guarded.schema.table("users", (table) => table.dropColumn("email")),
    MigrationGuardError
  );
});

test("Drizzle proxy rejects destructive execute SQL", () => {
  const database = {
    execute(sql) {
      return sql;
    }
  };

  const guarded = createGuardedDrizzle(database);

  assert.throws(
    () => guarded.execute("TRUNCATE TABLE audit_logs;"),
    MigrationGuardError
  );
});

test("MikroORM migration proxy rejects destructive addSql calls", () => {
  const migration = {
    addSql(sql) {
      return sql;
    },
    up() {
      this.addSql("DROP TABLE users;");
    }
  };

  const guarded = createGuardedMikroOrmMigration(migration);

  assert.throws(
    () => guarded.up(),
    MigrationGuardError
  );
});

test("MikroORM migration proxy keeps addSql guarded across async lifecycle work", async () => {
  const migration = {
    addSql(sql) {
      return sql;
    },
    async up() {
      await Promise.resolve();
      this.addSql("DROP TABLE users;");
    }
  };

  const guarded = createGuardedMikroOrmMigration(migration);

  await assert.rejects(
    () => guarded.up(),
    MigrationGuardError
  );
});

test("Unified package creates configured SQL guards", () => {
  const guard = createUnifiedMigrationGuard({
    orm: "prisma-migrate",
    database: "postgres",
    failOnWarnings: true
  });

  const result = guard.checkSql("ALTER TABLE users DROP COLUMN email;");

  assert.equal(guard.orm, "prisma");
  assert.equal(guard.database, "postgresql");
  assert.equal(result.passed, false);
  assert.equal(result.violations[0].source, "prisma");
});

test("Unified package wraps ORM runtime objects", () => {
  function knex() {
    return {};
  }

  knex.raw = (sql) => ({ sql });
  knex.schema = {
    table(tableName, callback) {
      const tableBuilder = {
        dropColumn(columnName) {
          return { tableName, columnName };
        }
      };
      callback(tableBuilder);
      return { tableName };
    }
  };

  const guard = createUnifiedMigrationGuard({ orm: "objection", database: "sqlite3" });
  const guarded = guard.wrap(knex);

  assert.equal(guard.orm, "knex");
  assert.equal(guard.database, "sqlite");
  assert.throws(
    () => guarded.schema.table("users", (table) => table.dropColumn("email")),
    MigrationGuardError
  );
});

test("Unified package reports unsupported adapter methods clearly", () => {
  const guard = createUnifiedMigrationGuard({ orm: "knex" });

  assert.deepEqual(getSupportedOrms(), ["drizzle", "knex", "mikro-orm", "prisma", "sequelize", "typeorm"]);
  assert.throws(
    () => guard.checkDirectory("migrations"),
    /knex adapter does not support checkDirectory/
  );
});
