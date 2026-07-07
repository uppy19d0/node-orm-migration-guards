import cjs from "./knex.cjs";

export * from "knex-migration-guard";
export const createKnexMigrationGuard = cjs.createKnexMigrationGuard;
export const createMigrationGuard = cjs.createMigrationGuard;

export default cjs;
