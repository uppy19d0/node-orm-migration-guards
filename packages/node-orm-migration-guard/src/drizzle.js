import cjs from "./drizzle.cjs";

export * from "drizzle-migration-guard";
export const createDrizzleMigrationGuard = cjs.createDrizzleMigrationGuard;
export const createMigrationGuard = cjs.createMigrationGuard;

export default cjs;
