"use strict";

const { assertSafeMigration, checkMigration } = require("migration-guard-core");

function formatTableName(tableName) {
  if (typeof tableName === "string") {
    return tableName;
  }

  if (tableName && typeof tableName === "object") {
    const schema = tableName.schema || tableName.schemaName;
    const name = tableName.tableName || tableName.table || tableName.name;
    return schema && name ? `${schema}.${name}` : String(name || JSON.stringify(tableName));
  }

  return String(tableName);
}

function guardSequelizeMigrationSql(sql, options = {}) {
  return checkMigration(sql, { source: "sequelize", ...options });
}

function assertSequelizeMigrationSql(sql, options = {}) {
  return assertSafeMigration(sql, { source: "sequelize", ...options });
}

function assertSequelizeOperation(operation, options = {}) {
  return assertSafeMigration([{ ...operation, source: "sequelize" }], options);
}

function wrapSequelizeInstance(sequelize, options) {
  if (!sequelize || typeof sequelize.query !== "function") {
    return sequelize;
  }

  return new Proxy(sequelize, {
    get(target, property, receiver) {
      if (property !== "query") {
        return Reflect.get(target, property, receiver);
      }

      return function guardedSequelizeQuery(sql, ...args) {
        assertSequelizeMigrationSql(String(sql), options);
        return target.query.call(target, sql, ...args);
      };
    }
  });
}

function createGuardedQueryInterface(queryInterface, options = {}) {
  if (!queryInterface || typeof queryInterface !== "object") {
    throw new TypeError("Expected a Sequelize QueryInterface object.");
  }

  return new Proxy(queryInterface, {
    get(target, property, receiver) {
      const value = Reflect.get(target, property, receiver);

      if (property === "sequelize") {
        return wrapSequelizeInstance(value, options);
      }

      if (typeof value !== "function") {
        return value;
      }

      if (property === "dropTable") {
        return function guardedDropTable(tableName, ...args) {
          assertSequelizeOperation({ type: "dropTable", table: formatTableName(tableName) }, options);
          return value.call(target, tableName, ...args);
        };
      }

      if (property === "removeColumn") {
        return function guardedRemoveColumn(tableName, columnName, ...args) {
          assertSequelizeOperation({ type: "dropColumn", table: formatTableName(tableName), column: columnName }, options);
          return value.call(target, tableName, columnName, ...args);
        };
      }

      if (property === "renameTable") {
        return function guardedRenameTable(before, after, ...args) {
          assertSequelizeOperation({ type: "renameTable", table: formatTableName(before), toTable: formatTableName(after) }, options);
          return value.call(target, before, after, ...args);
        };
      }

      if (property === "renameColumn") {
        return function guardedRenameColumn(tableName, before, after, ...args) {
          assertSequelizeOperation({ type: "renameColumn", table: formatTableName(tableName), column: before, toColumn: after }, options);
          return value.call(target, tableName, before, after, ...args);
        };
      }

      return value.bind(target);
    }
  });
}

module.exports = {
  assertSequelizeMigrationSql,
  createGuardedQueryInterface,
  guardSequelizeMigrationSql
};

