"use strict";

const knex = require("knex-migration-guard");
const { createConfiguredGuard } = require("./shared.cjs");

const adapter = {
  assertSql: knex.assertKnexMigrationSql,
  checkSql: knex.guardKnexMigrationSql,
  wrap: knex.createGuardedKnex
};

function createKnexMigrationGuard(config = {}) {
  return createConfiguredGuard("knex", adapter, config);
}

module.exports = {
  ...knex,
  createKnexMigrationGuard,
  createMigrationGuard: createKnexMigrationGuard
};
