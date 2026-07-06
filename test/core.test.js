import assert from "node:assert/strict";
import test from "node:test";

import {
  MigrationGuardError,
  assertSafeMigration,
  checkMigration,
  parseSqlMigration,
  splitSqlStatements
} from "migration-guard-core";

test("splits SQL statements without splitting quoted semicolons", () => {
  const statements = splitSqlStatements("select ';'; drop table users;");

  assert.deepEqual(statements, ["select ';'", "drop table users"]);
});

test("parses destructive SQL operations", () => {
  const operations = parseSqlMigration(`
    ALTER TABLE users DROP COLUMN email;
    TRUNCATE TABLE audit_logs;
  `);

  assert.equal(operations[0].type, "dropColumn");
  assert.equal(operations[0].table, "users");
  assert.equal(operations[0].column, "email");
  assert.equal(operations[1].type, "truncateTable");
  assert.equal(operations[1].table, "audit_logs");
});

test("blocks destructive operations by default", () => {
  const result = checkMigration("ALTER TABLE users DROP COLUMN email;");

  assert.equal(result.passed, false);
  assert.equal(result.violations[0].ruleId, "dropColumn");
  assert.throws(
    () => assertSafeMigration("DROP TABLE users;"),
    MigrationGuardError
  );
});

test("allows specific destructive operations", () => {
  const result = checkMigration("DROP TABLE users;", {
    allowDropTable: ["users"]
  });

  assert.equal(result.passed, true);
  assert.equal(result.violations.length, 0);
});

test("warns for NOT NULL columns without defaults", () => {
  const result = checkMigration("ALTER TABLE users ADD COLUMN status text NOT NULL;");

  assert.equal(result.passed, true);
  assert.equal(result.hasWarnings, true);
  assert.equal(result.violations[0].ruleId, "addNotNullColumnWithoutDefault");

  const strict = checkMigration("ALTER TABLE users ADD COLUMN status text NOT NULL;", {
    failOnWarnings: true
  });

  assert.equal(strict.passed, false);
});

