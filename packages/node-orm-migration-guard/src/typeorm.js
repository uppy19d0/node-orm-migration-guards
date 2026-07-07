import cjs from "./typeorm.cjs";

export * from "typeorm-migration-guard";
export const createMigrationGuard = cjs.createMigrationGuard;
export const createTypeOrmMigrationGuard = cjs.createTypeOrmMigrationGuard;

export default cjs;
