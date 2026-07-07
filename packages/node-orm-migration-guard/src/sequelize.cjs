"use strict";

const sequelize = require("sequelize-migration-guard");
const { createConfiguredGuard } = require("./shared.cjs");

const adapter = {
  assertSql: sequelize.assertSequelizeMigrationSql,
  checkSql: sequelize.guardSequelizeMigrationSql,
  wrap: sequelize.createGuardedQueryInterface
};

function createSequelizeMigrationGuard(config = {}) {
  return createConfiguredGuard("sequelize", adapter, config);
}

module.exports = {
  ...sequelize,
  createMigrationGuard: createSequelizeMigrationGuard,
  createSequelizeMigrationGuard
};
