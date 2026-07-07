"use strict";

const typeorm = require("typeorm-migration-guard");
const { createConfiguredGuard } = require("./shared.cjs");

const adapter = {
  assertSql: typeorm.assertTypeOrmMigrationSql,
  checkSql: typeorm.guardTypeOrmMigrationSql,
  wrap: typeorm.createGuardedQueryRunner,
  wrapMigration: typeorm.guardTypeOrmMigrationInstance
};

function createTypeOrmMigrationGuard(config = {}) {
  return createConfiguredGuard("typeorm", adapter, config);
}

module.exports = {
  ...typeorm,
  createMigrationGuard: createTypeOrmMigrationGuard,
  createTypeOrmMigrationGuard
};
