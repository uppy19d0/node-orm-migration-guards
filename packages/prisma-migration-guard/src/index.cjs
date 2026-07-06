"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { MigrationGuardError, assertSafeMigration, checkMigration, formatMigrationGuardMessage } = require("migration-guard-core");

function guardPrismaMigrationSql(sql, options = {}) {
  return checkMigration(sql, { source: "prisma", ...options });
}

function assertPrismaMigrationSql(sql, options = {}) {
  return assertSafeMigration(sql, { source: "prisma", ...options });
}

function resolveMigrationSqlPath(fileOrDirectory) {
  const stat = fs.statSync(fileOrDirectory);
  if (stat.isDirectory()) {
    return path.join(fileOrDirectory, "migration.sql");
  }

  return fileOrDirectory;
}

function readPrismaMigrationSql(fileOrDirectory) {
  const sqlPath = resolveMigrationSqlPath(fileOrDirectory);
  return {
    path: sqlPath,
    sql: fs.readFileSync(sqlPath, "utf8")
  };
}

function guardPrismaMigrationFile(fileOrDirectory, options = {}) {
  const migration = readPrismaMigrationSql(fileOrDirectory);
  return checkMigration(migration.sql, { source: migration.path, ...options });
}

function assertPrismaMigrationFile(fileOrDirectory, options = {}) {
  const migration = readPrismaMigrationSql(fileOrDirectory);
  return assertSafeMigration(migration.sql, { source: migration.path, ...options });
}

function listPrismaMigrationFiles(directory) {
  const entries = fs.readdirSync(directory, { withFileTypes: true });
  const files = [];
  const directMigration = path.join(directory, "migration.sql");

  if (fs.existsSync(directMigration)) {
    files.push(directMigration);
  }

  for (const entry of entries) {
    if (!entry.isDirectory()) {
      continue;
    }

    const migrationFile = path.join(directory, entry.name, "migration.sql");
    if (fs.existsSync(migrationFile)) {
      files.push(migrationFile);
    }
  }

  return files.sort();
}

function mergeResults(results, options = {}) {
  const operations = results.flatMap((result) => result.operations);
  const violations = results.flatMap((result) => result.violations);
  const hasErrors = violations.some((violation) => violation.severity === "error");
  const hasWarnings = violations.some((violation) => violation.severity === "warning");

  return {
    passed: !hasErrors && !(options.failOnWarnings && hasWarnings),
    operations,
    violations,
    hasErrors,
    hasWarnings,
    files: results.map((result) => result.file).filter(Boolean)
  };
}

function guardPrismaMigrationDirectory(directory, options = {}) {
  const results = listPrismaMigrationFiles(directory).map((file) => ({
    ...guardPrismaMigrationFile(file, options),
    file
  }));

  return mergeResults(results, options);
}

function assertPrismaMigrationDirectory(directory, options = {}) {
  const result = guardPrismaMigrationDirectory(directory, options);
  if (!result.passed) {
    throw new MigrationGuardError(result, formatMigrationGuardMessage(result));
  }

  return result;
}

module.exports = {
  assertPrismaMigrationDirectory,
  assertPrismaMigrationFile,
  assertPrismaMigrationSql,
  guardPrismaMigrationDirectory,
  guardPrismaMigrationFile,
  guardPrismaMigrationSql,
  readPrismaMigrationSql
};

