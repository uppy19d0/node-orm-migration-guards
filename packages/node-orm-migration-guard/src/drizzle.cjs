"use strict";

const drizzle = require("drizzle-migration-guard");
const { createConfiguredGuard } = require("./shared.cjs");

const adapter = {
  assertDirectory: drizzle.assertDrizzleMigrationDirectory,
  assertFile: drizzle.assertDrizzleMigrationFile,
  assertSql: drizzle.assertDrizzleMigrationSql,
  checkDirectory: drizzle.guardDrizzleMigrationDirectory,
  checkFile: drizzle.guardDrizzleMigrationFile,
  checkSql: drizzle.guardDrizzleMigrationSql,
  wrap: drizzle.createGuardedDrizzle
};

function createDrizzleMigrationGuard(config = {}) {
  return createConfiguredGuard("drizzle", adapter, config);
}

module.exports = {
  ...drizzle,
  createDrizzleMigrationGuard,
  createMigrationGuard: createDrizzleMigrationGuard
};
