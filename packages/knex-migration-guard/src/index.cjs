"use strict";

const { assertSafeMigration, checkMigration } = require("migration-guard-core");

function guardKnexMigrationSql(sql, options = {}) {
  return checkMigration(sql, { source: "knex", ...options });
}

function assertKnexMigrationSql(sql, options = {}) {
  return assertSafeMigration(sql, { source: "knex", ...options });
}

function extractSqlText(sql) {
  if (typeof sql === "string") {
    return sql;
  }

  if (sql && typeof sql.sql === "string") {
    return sql.sql;
  }

  if (sql && typeof sql.toSQL === "function") {
    const compiled = sql.toSQL();
    if (Array.isArray(compiled)) {
      return compiled.map((item) => item.sql || String(item)).join(";\n");
    }
    if (compiled && typeof compiled.sql === "string") {
      return compiled.sql;
    }
  }

  return String(sql);
}

function assertKnexOperation(operation, options = {}) {
  return assertSafeMigration([{ ...operation, source: "knex" }], options);
}

function wrapTableBuilder(tableBuilder, tableName, options) {
  return new Proxy(tableBuilder, {
    get(target, property, receiver) {
      const value = Reflect.get(target, property, receiver);

      if (typeof value !== "function") {
        return value;
      }

      if (property === "dropColumn") {
        return function guardedDropColumn(columnName, ...args) {
          assertKnexOperation({ type: "dropColumn", table: tableName, column: columnName }, options);
          return value.call(target, columnName, ...args);
        };
      }

      if (property === "dropColumns") {
        return function guardedDropColumns(...columns) {
          for (const columnName of columns) {
            assertKnexOperation({ type: "dropColumn", table: tableName, column: columnName }, options);
          }
          return value.apply(target, columns);
        };
      }

      if (property === "renameColumn") {
        return function guardedRenameColumn(before, after, ...args) {
          assertKnexOperation({ type: "renameColumn", table: tableName, column: before, toColumn: after }, options);
          return value.call(target, before, after, ...args);
        };
      }

      return value.bind(target);
    }
  });
}

function wrapSchemaBuilder(schema, options) {
  return new Proxy(schema, {
    get(target, property, receiver) {
      const value = Reflect.get(target, property, receiver);

      if (typeof value !== "function") {
        return value;
      }

      if (property === "raw") {
        return function guardedSchemaRaw(sql, ...args) {
          assertKnexMigrationSql(extractSqlText(sql), options);
          return value.call(target, sql, ...args);
        };
      }

      if (property === "dropTable" || property === "dropTableIfExists") {
        return function guardedDropTable(tableName, ...args) {
          assertKnexOperation({ type: "dropTable", table: tableName }, options);
          return value.call(target, tableName, ...args);
        };
      }

      if (property === "renameTable") {
        return function guardedRenameTable(before, after, ...args) {
          assertKnexOperation({ type: "renameTable", table: before, toTable: after }, options);
          return value.call(target, before, after, ...args);
        };
      }

      if (property === "table" || property === "alterTable") {
        return function guardedAlterTable(tableName, callback, ...args) {
          const wrappedCallback = typeof callback === "function"
            ? function callbackWithGuardedTable(tableBuilder) {
                return callback(wrapTableBuilder(tableBuilder, tableName, options));
              }
            : callback;

          return value.call(target, tableName, wrappedCallback, ...args);
        };
      }

      return value.bind(target);
    }
  });
}

function createGuardedKnex(knex, options = {}) {
  if (!knex || typeof knex !== "function" || typeof knex.raw !== "function") {
    throw new TypeError("Expected a Knex instance function with a raw(sql, ...args) method.");
  }

  return new Proxy(knex, {
    apply(target, thisArg, args) {
      return Reflect.apply(target, thisArg, args);
    },
    get(target, property, receiver) {
      if (property === "raw") {
        return function guardedRaw(sql, ...args) {
          assertKnexMigrationSql(extractSqlText(sql), options);
          return target.raw.call(target, sql, ...args);
        };
      }

      if (property === "schema") {
        return wrapSchemaBuilder(target.schema, options);
      }

      return Reflect.get(target, property, receiver);
    }
  });
}

module.exports = {
  assertKnexMigrationSql,
  createGuardedKnex,
  guardKnexMigrationSql
};

