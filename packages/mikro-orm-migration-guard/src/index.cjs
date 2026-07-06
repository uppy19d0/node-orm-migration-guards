"use strict";

const { assertSafeMigration, checkMigration } = require("migration-guard-core");

function guardMikroOrmMigrationSql(sql, options = {}) {
  return checkMigration(sql, { source: "mikro-orm", ...options });
}

function assertMikroOrmMigrationSql(sql, options = {}) {
  return assertSafeMigration(sql, { source: "mikro-orm", ...options });
}

function withGuardedAddSql(migration, options, callback) {
  const originalAddSql = migration.addSql;

  migration.addSql = function guardedAddSql(sql, ...args) {
    assertMikroOrmMigrationSql(String(sql), options);
    return originalAddSql.call(this, sql, ...args);
  };

  try {
    const result = callback();
    if (result && typeof result.then === "function") {
      return result.finally(() => {
        migration.addSql = originalAddSql;
      });
    }

    migration.addSql = originalAddSql;
    return result;
  } catch (error) {
    migration.addSql = originalAddSql;
    throw error;
  }
}

function createGuardedMikroOrmMigration(migration, options = {}) {
  if (!migration || typeof migration !== "object" || typeof migration.addSql !== "function") {
    throw new TypeError("Expected a MikroORM migration instance with an addSql(sql) method.");
  }

  return new Proxy(migration, {
    get(target, property, receiver) {
      const value = Reflect.get(target, property, receiver);

      if (property === "addSql") {
        return function guardedAddSql(sql, ...args) {
          assertMikroOrmMigrationSql(String(sql), options);
          return value.call(target, sql, ...args);
        };
      }

      if ((property === "up" || property === "down") && typeof value === "function") {
        return function guardedMigrationLifecycle(...args) {
          return withGuardedAddSql(target, options, () => value.apply(target, args));
        };
      }

      return typeof value === "function" ? value.bind(target) : value;
    }
  });
}

module.exports = {
  assertMikroOrmMigrationSql,
  createGuardedMikroOrmMigration,
  guardMikroOrmMigrationSql
};
