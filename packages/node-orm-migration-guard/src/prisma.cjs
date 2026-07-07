"use strict";

const prisma = require("prisma-migration-guard");
const { createConfiguredGuard } = require("./shared.cjs");

const adapter = {
  assertDirectory: prisma.assertPrismaMigrationDirectory,
  assertFile: prisma.assertPrismaMigrationFile,
  assertSql: prisma.assertPrismaMigrationSql,
  checkDirectory: prisma.guardPrismaMigrationDirectory,
  checkFile: prisma.guardPrismaMigrationFile,
  checkSql: prisma.guardPrismaMigrationSql
};

function createPrismaMigrationGuard(config = {}) {
  return createConfiguredGuard("prisma", adapter, config);
}

module.exports = {
  ...prisma,
  createMigrationGuard: createPrismaMigrationGuard,
  createPrismaMigrationGuard
};
