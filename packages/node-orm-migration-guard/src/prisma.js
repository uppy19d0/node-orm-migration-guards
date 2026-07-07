import cjs from "./prisma.cjs";

export * from "prisma-migration-guard";
export const createMigrationGuard = cjs.createMigrationGuard;
export const createPrismaMigrationGuard = cjs.createPrismaMigrationGuard;

export default cjs;
