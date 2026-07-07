import cjs from "./sequelize.cjs";

export * from "sequelize-migration-guard";
export const createMigrationGuard = cjs.createMigrationGuard;
export const createSequelizeMigrationGuard = cjs.createSequelizeMigrationGuard;

export default cjs;
