import cjs from "./mikro-orm.cjs";

export * from "mikro-orm-migration-guard";
export const createMigrationGuard = cjs.createMigrationGuard;
export const createMikroOrmMigrationGuard = cjs.createMikroOrmMigrationGuard;

export default cjs;
