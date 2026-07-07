"use strict";

const core = require("migration-guard-core");
const drizzle = require("drizzle-migration-guard");
const knex = require("knex-migration-guard");
const mikroOrm = require("mikro-orm-migration-guard");
const prisma = require("prisma-migration-guard");
const sequelize = require("sequelize-migration-guard");
const typeorm = require("typeorm-migration-guard");

const ORM_ALIASES = new Map([
  ["drizzle", "drizzle"],
  ["drizzle-orm", "drizzle"],
  ["knex", "knex"],
  ["objection", "knex"],
  ["objection.js", "knex"],
  ["mikro", "mikro-orm"],
  ["mikro-orm", "mikro-orm"],
  ["mikroorm", "mikro-orm"],
  ["prisma", "prisma"],
  ["prisma-migrate", "prisma"],
  ["sequelize", "sequelize"],
  ["typeorm", "typeorm"],
  ["type-orm", "typeorm"]
]);

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

function normalizeOrm(orm) {
  const normalized = normalizeToken(orm, "orm");
  const alias = ORM_ALIASES.get(normalized);

  if (!alias) {
    throw new TypeError(`Unsupported ORM "${orm}". Supported ORMs: ${getSupportedOrms().join(", ")}.`);
  }

  return alias;
}

function normalizeDatabase(database) {
  if (database == null) {
    return undefined;
  }

  const normalized = normalizeToken(database, "database");
  return DATABASE_ALIASES.get(normalized) || normalized;
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

function createAdapterMap() {
  return {
    drizzle: {
      assertDirectory: drizzle.assertDrizzleMigrationDirectory,
      assertFile: drizzle.assertDrizzleMigrationFile,
      assertSql: drizzle.assertDrizzleMigrationSql,
      checkDirectory: drizzle.guardDrizzleMigrationDirectory,
      checkFile: drizzle.guardDrizzleMigrationFile,
      checkSql: drizzle.guardDrizzleMigrationSql,
      wrap: drizzle.createGuardedDrizzle
    },
    knex: {
      assertSql: knex.assertKnexMigrationSql,
      checkSql: knex.guardKnexMigrationSql,
      wrap: knex.createGuardedKnex
    },
    "mikro-orm": {
      assertSql: mikroOrm.assertMikroOrmMigrationSql,
      checkSql: mikroOrm.guardMikroOrmMigrationSql,
      wrap: mikroOrm.createGuardedMikroOrmMigration,
      wrapMigration: mikroOrm.createGuardedMikroOrmMigration
    },
    prisma: {
      assertDirectory: prisma.assertPrismaMigrationDirectory,
      assertFile: prisma.assertPrismaMigrationFile,
      assertSql: prisma.assertPrismaMigrationSql,
      checkDirectory: prisma.guardPrismaMigrationDirectory,
      checkFile: prisma.guardPrismaMigrationFile,
      checkSql: prisma.guardPrismaMigrationSql
    },
    sequelize: {
      assertSql: sequelize.assertSequelizeMigrationSql,
      checkSql: sequelize.guardSequelizeMigrationSql,
      wrap: sequelize.createGuardedQueryInterface
    },
    typeorm: {
      assertSql: typeorm.assertTypeOrmMigrationSql,
      checkSql: typeorm.guardTypeOrmMigrationSql,
      wrap: typeorm.createGuardedQueryRunner,
      wrapMigration: typeorm.guardTypeOrmMigrationInstance
    }
  };
}

const ADAPTERS = createAdapterMap();

function getSupportedOrms() {
  return Object.keys(ADAPTERS);
}

function getSupportedDatabases() {
  return [...new Set(DATABASE_ALIASES.values())].sort();
}

function resolveAdapter(orm) {
  const normalizedOrm = normalizeOrm(orm);
  return {
    orm: normalizedOrm,
    adapter: ADAPTERS[normalizedOrm]
  };
}

function createMigrationGuard(config = {}) {
  if (!config || typeof config !== "object") {
    throw new TypeError("Expected a migration guard configuration object.");
  }

  const { orm, database, ...defaultOptions } = config;
  const resolved = resolveAdapter(orm);
  const normalizedDatabase = normalizeDatabase(database);
  const adapter = resolved.adapter;

  return {
    orm: resolved.orm,
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
        source: resolved.orm,
        ...mergeGuardOptions(defaultOptions, options)
      });
    },
    assert(input, options = {}) {
      if (typeof input === "string") {
        return adapter.assertSql(input, mergeGuardOptions(defaultOptions, options));
      }

      return core.assertSafeMigration(input, {
        source: resolved.orm,
        ...mergeGuardOptions(defaultOptions, options)
      });
    },
    checkFile(file, options = {}) {
      const checkFile = adapter.checkFile || unsupported(resolved.orm, "checkFile");
      return checkFile(file, mergeGuardOptions(defaultOptions, options));
    },
    assertFile(file, options = {}) {
      const assertFile = adapter.assertFile || unsupported(resolved.orm, "assertFile");
      return assertFile(file, mergeGuardOptions(defaultOptions, options));
    },
    checkDirectory(directory, options = {}) {
      const checkDirectory = adapter.checkDirectory || unsupported(resolved.orm, "checkDirectory");
      return checkDirectory(directory, mergeGuardOptions(defaultOptions, options));
    },
    assertDirectory(directory, options = {}) {
      const assertDirectory = adapter.assertDirectory || unsupported(resolved.orm, "assertDirectory");
      return assertDirectory(directory, mergeGuardOptions(defaultOptions, options));
    },
    wrap(target, options = {}) {
      const wrap = adapter.wrap || unsupported(resolved.orm, "wrap");
      return wrap(target, mergeGuardOptions(defaultOptions, options));
    },
    wrapMigration(migration, options = {}) {
      const wrapMigration = adapter.wrapMigration || adapter.wrap || unsupported(resolved.orm, "wrapMigration");
      return wrapMigration(migration, mergeGuardOptions(defaultOptions, options));
    }
  };
}

module.exports = {
  ...core,
  assertDrizzleMigrationDirectory: drizzle.assertDrizzleMigrationDirectory,
  assertDrizzleMigrationFile: drizzle.assertDrizzleMigrationFile,
  assertDrizzleMigrationSql: drizzle.assertDrizzleMigrationSql,
  assertKnexMigrationSql: knex.assertKnexMigrationSql,
  assertMikroOrmMigrationSql: mikroOrm.assertMikroOrmMigrationSql,
  assertPrismaMigrationDirectory: prisma.assertPrismaMigrationDirectory,
  assertPrismaMigrationFile: prisma.assertPrismaMigrationFile,
  assertPrismaMigrationSql: prisma.assertPrismaMigrationSql,
  assertSequelizeMigrationSql: sequelize.assertSequelizeMigrationSql,
  assertTypeOrmMigrationSql: typeorm.assertTypeOrmMigrationSql,
  createCoreMigrationGuard: core.createMigrationGuard,
  createGuardedDrizzle: drizzle.createGuardedDrizzle,
  createGuardedKnex: knex.createGuardedKnex,
  createGuardedMikroOrmMigration: mikroOrm.createGuardedMikroOrmMigration,
  createGuardedQueryInterface: sequelize.createGuardedQueryInterface,
  createGuardedQueryRunner: typeorm.createGuardedQueryRunner,
  createMigrationGuard,
  extractDrizzleSqlText: drizzle.extractDrizzleSqlText,
  getSupportedDatabases,
  getSupportedOrms,
  guardDrizzleMigrationDirectory: drizzle.guardDrizzleMigrationDirectory,
  guardDrizzleMigrationFile: drizzle.guardDrizzleMigrationFile,
  guardDrizzleMigrationSql: drizzle.guardDrizzleMigrationSql,
  guardKnexMigrationSql: knex.guardKnexMigrationSql,
  guardMikroOrmMigrationSql: mikroOrm.guardMikroOrmMigrationSql,
  guardPrismaMigrationDirectory: prisma.guardPrismaMigrationDirectory,
  guardPrismaMigrationFile: prisma.guardPrismaMigrationFile,
  guardPrismaMigrationSql: prisma.guardPrismaMigrationSql,
  guardSequelizeMigrationSql: sequelize.guardSequelizeMigrationSql,
  guardTypeOrmMigrationInstance: typeorm.guardTypeOrmMigrationInstance,
  guardTypeOrmMigrationSql: typeorm.guardTypeOrmMigrationSql,
  readPrismaMigrationSql: prisma.readPrismaMigrationSql,
  resolveAdapter
};
