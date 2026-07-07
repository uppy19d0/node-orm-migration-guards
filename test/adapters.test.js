import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { MigrationGuardError } from "migration-guard-core";
import { createGuardedDrizzle } from "drizzle-migration-guard";
import { createGuardedKnex } from "knex-migration-guard";
import { createGuardedMikroOrmMigration } from "mikro-orm-migration-guard";
import { assertSafeMigration as assertCoreSafeMigration } from "node-orm-migration-guard/core";
import { createMigrationGuard as createDrizzleSubpathGuard } from "node-orm-migration-guard/drizzle";
import { createMigrationGuard as createObjectionSubpathGuard } from "node-orm-migration-guard/objection";
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

test("Unified package exposes per-adapter subpath guards", () => {
  const drizzleGuard = createDrizzleSubpathGuard({ database: "pg" });
  const drizzleResult = drizzleGuard.checkSql("DROP TABLE users;");

  assert.equal(drizzleGuard.orm, "drizzle");
  assert.equal(drizzleGuard.database, "postgresql");
  assert.equal(drizzleResult.passed, false);
  assert.equal(drizzleResult.violations[0].source, "drizzle");

  const objectionGuard = createObjectionSubpathGuard({ database: "sqlite3" });

  assert.equal(objectionGuard.orm, "knex");
  assert.equal(objectionGuard.database, "sqlite");
  assert.throws(
    () => objectionGuard.checkDirectory("migrations"),
    /knex adapter does not support checkDirectory/
  );
});

test("Unified package exposes core subpath helpers", () => {
  assert.throws(
    () => assertCoreSafeMigration("DROP TABLE users;"),
    MigrationGuardError
  );
});
