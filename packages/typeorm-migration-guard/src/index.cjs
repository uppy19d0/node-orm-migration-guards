"use strict";

const { assertSafeMigration, checkMigration } = require("migration-guard-core");

function guardTypeOrmMigrationSql(sql, options = {}) {
  return checkMigration(sql, { source: "typeorm", ...options });
}

function assertTypeOrmMigrationSql(sql, options = {}) {
  return assertSafeMigration(sql, { source: "typeorm", ...options });
}

function createGuardedQueryRunner(queryRunner, options = {}) {
  if (!queryRunner || typeof queryRunner.query !== "function") {
    throw new TypeError("Expected a TypeORM QueryRunner with a query(sql, ...args) method.");
  }

  return new Proxy(queryRunner, {
    get(target, property, receiver) {
      if (property !== "query") {
        return Reflect.get(target, property, receiver);
      }

      return function guardedQuery(sql, ...args) {
        assertTypeOrmMigrationSql(String(sql), options);
        return target.query.call(target, sql, ...args);
      };
    }
  });
}

function guardTypeOrmMigrationInstance(migration, options = {}) {
  if (!migration || typeof migration.up !== "function") {
    throw new TypeError("Expected a TypeORM migration instance with an up(queryRunner) method.");
  }

  const guarded = Object.create(Object.getPrototypeOf(migration));
  Object.assign(guarded, migration);

  guarded.up = function guardedUp(queryRunner, ...args) {
    return migration.up.call(this, createGuardedQueryRunner(queryRunner, options), ...args);
  };

  return guarded;
}

module.exports = {
  assertTypeOrmMigrationSql,
  createGuardedQueryRunner,
  guardTypeOrmMigrationInstance,
  guardTypeOrmMigrationSql
};

