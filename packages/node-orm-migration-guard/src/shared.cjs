"use strict";

const core = require("migration-guard-core");

const DATABASE_ALIASES = new Map([
  ["cockroach", "cockroachdb"],
  ["cockroachdb", "cockroachdb"],
  ["maria", "mariadb"],
  ["mariadb", "mariadb"],
  ["mssql", "sqlserver"],
  ["mysql", "mysql"],
  ["pg", "postgresql"],
  ["postgres", "postgresql"],
  ["postgresql", "postgresql"],
  ["sqlite", "sqlite"],
  ["sqlite3", "sqlite"],
  ["sqlserver", "sqlserver"]
]);

function normalizeToken(value, label) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new TypeError(`Expected ${label} to be a non-empty string.`);
  }

  return value.trim().toLowerCase();
}

function normalizeDatabase(database) {
  if (database == null) {
    return undefined;
  }

  const normalized = normalizeToken(database, "database");
  return DATABASE_ALIASES.get(normalized) || normalized;
}

function getSupportedDatabases() {
  return [...new Set(DATABASE_ALIASES.values())].sort();
}

function unsupported(orm, method) {
  return function unsupportedAdapterMethod() {
    throw new TypeError(`The ${orm} adapter does not support ${method}().`);
  };
}

function mergeGuardOptions(defaultOptions, options) {
  return {
    ...defaultOptions,
    ...options
  };
}

function createConfiguredGuard(orm, adapter, config = {}) {
  if (!config || typeof config !== "object") {
    throw new TypeError("Expected a migration guard configuration object.");
  }

  const { orm: ignoredOrm, database, ...defaultOptions } = config;
  const normalizedDatabase = normalizeDatabase(database);

  return {
    orm,
    database: normalizedDatabase,
    checkSql(sql, options = {}) {
      return adapter.checkSql(sql, mergeGuardOptions(defaultOptions, options));
    },
    assertSql(sql, options = {}) {
      return adapter.assertSql(sql, mergeGuardOptions(defaultOptions, options));
    },
    check(input, options = {}) {
      if (typeof input === "string") {
        return adapter.checkSql(input, mergeGuardOptions(defaultOptions, options));
      }

      return core.checkMigration(input, {
        source: orm,
        ...mergeGuardOptions(defaultOptions, options)
      });
    },
    assert(input, options = {}) {
      if (typeof input === "string") {
        return adapter.assertSql(input, mergeGuardOptions(defaultOptions, options));
      }

      return core.assertSafeMigration(input, {
        source: orm,
        ...mergeGuardOptions(defaultOptions, options)
      });
    },
    checkFile(file, options = {}) {
      const checkFile = adapter.checkFile || unsupported(orm, "checkFile");
      return checkFile(file, mergeGuardOptions(defaultOptions, options));
    },
    assertFile(file, options = {}) {
      const assertFile = adapter.assertFile || unsupported(orm, "assertFile");
      return assertFile(file, mergeGuardOptions(defaultOptions, options));
    },
    checkDirectory(directory, options = {}) {
      const checkDirectory = adapter.checkDirectory || unsupported(orm, "checkDirectory");
      return checkDirectory(directory, mergeGuardOptions(defaultOptions, options));
    },
    assertDirectory(directory, options = {}) {
      const assertDirectory = adapter.assertDirectory || unsupported(orm, "assertDirectory");
      return assertDirectory(directory, mergeGuardOptions(defaultOptions, options));
    },
    wrap(target, options = {}) {
      const wrap = adapter.wrap || unsupported(orm, "wrap");
      return wrap(target, mergeGuardOptions(defaultOptions, options));
    },
    wrapMigration(migration, options = {}) {
      const wrapMigration = adapter.wrapMigration || adapter.wrap || unsupported(orm, "wrapMigration");
      return wrapMigration(migration, mergeGuardOptions(defaultOptions, options));
    }
  };
}

module.exports = {
  createConfiguredGuard,
  getSupportedDatabases,
  mergeGuardOptions,
  normalizeDatabase
};
