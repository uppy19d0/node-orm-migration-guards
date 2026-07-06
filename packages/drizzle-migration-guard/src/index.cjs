"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { MigrationGuardError, assertSafeMigration, checkMigration, formatMigrationGuardMessage } = require("migration-guard-core");

const GUARDED_DB_METHODS = new Set(["execute", "run", "all", "get", "values"]);

function extractDrizzleSqlText(input) {
  if (typeof input === "string") {
    return input;
  }

  if (input && typeof input.sql === "string") {
    return input.sql;
  }

  if (input && typeof input.toSQL === "function") {
    const compiled = input.toSQL();
    if (compiled && typeof compiled.sql === "string") {
      return compiled.sql;
    }
  }

  if (input && Array.isArray(input.queryChunks)) {
    return input.queryChunks
      .map((chunk) => {
        if (typeof chunk === "string") {
          return chunk;
        }
        if (chunk && typeof chunk.value === "string") {
          return chunk.value;
        }
        return "";
      })
      .join("");
  }

  return null;
}

function guardDrizzleMigrationSql(sql, options = {}) {
  return checkMigration(sql, { source: "drizzle", ...options });
}

function assertDrizzleMigrationSql(sql, options = {}) {
  return assertSafeMigration(sql, { source: "drizzle", ...options });
}

function guardDrizzleMigrationFile(file, options = {}) {
  const sql = fs.readFileSync(file, "utf8");
  return checkMigration(sql, { source: file, ...options });
}

function assertDrizzleMigrationFile(file, options = {}) {
  const sql = fs.readFileSync(file, "utf8");
  return assertSafeMigration(sql, { source: file, ...options });
}

function listDrizzleMigrationFiles(directory) {
  const files = [];

  function visit(current) {
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const fullPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        if (entry.name !== "meta") {
          visit(fullPath);
        }
        continue;
      }

      if (entry.isFile() && entry.name.endsWith(".sql")) {
        files.push(fullPath);
      }
    }
  }

  visit(directory);
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

function guardDrizzleMigrationDirectory(directory, options = {}) {
  const results = listDrizzleMigrationFiles(directory).map((file) => ({
    ...guardDrizzleMigrationFile(file, options),
    file
  }));

  return mergeResults(results, options);
}

function assertDrizzleMigrationDirectory(directory, options = {}) {
  const result = guardDrizzleMigrationDirectory(directory, options);
  if (!result.passed) {
    throw new MigrationGuardError(result, formatMigrationGuardMessage(result));
  }

  return result;
}

function createGuardedDrizzle(database, options = {}) {
  if (!database || typeof database !== "object") {
    throw new TypeError("Expected a Drizzle database object.");
  }

  return new Proxy(database, {
    get(target, property, receiver) {
      const value = Reflect.get(target, property, receiver);
      if (!GUARDED_DB_METHODS.has(property) || typeof value !== "function") {
        return typeof value === "function" ? value.bind(target) : value;
      }

      return function guardedDrizzleQuery(sql, ...args) {
        const sqlText = extractDrizzleSqlText(sql);
        if (sqlText) {
          assertDrizzleMigrationSql(sqlText, options);
        }

        return value.call(target, sql, ...args);
      };
    }
  });
}

module.exports = {
  assertDrizzleMigrationDirectory,
  assertDrizzleMigrationFile,
  assertDrizzleMigrationSql,
  createGuardedDrizzle,
  extractDrizzleSqlText,
  guardDrizzleMigrationDirectory,
  guardDrizzleMigrationFile,
  guardDrizzleMigrationSql
};

