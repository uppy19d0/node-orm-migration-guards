"use strict";

const mikroOrm = require("mikro-orm-migration-guard");
const { createConfiguredGuard } = require("./shared.cjs");

const adapter = {
  assertSql: mikroOrm.assertMikroOrmMigrationSql,
  checkSql: mikroOrm.guardMikroOrmMigrationSql,
  wrap: mikroOrm.createGuardedMikroOrmMigration,
  wrapMigration: mikroOrm.createGuardedMikroOrmMigration
};

function createMikroOrmMigrationGuard(config = {}) {
  return createConfiguredGuard("mikro-orm", adapter, config);
}

module.exports = {
  ...mikroOrm,
  createMigrationGuard: createMikroOrmMigrationGuard,
  createMikroOrmMigrationGuard
};
