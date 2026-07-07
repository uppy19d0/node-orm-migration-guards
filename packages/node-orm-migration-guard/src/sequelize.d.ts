import type { MigrationGuardOptions } from "migration-guard-core";
import type { MigrationGuardDatabase, NodeOrmMigrationGuard } from "./index.js";

export * from "sequelize-migration-guard";

export interface SequelizeMigrationGuardConfig extends MigrationGuardOptions {
  database?: MigrationGuardDatabase;
}

export declare function createSequelizeMigrationGuard(config?: SequelizeMigrationGuardConfig): NodeOrmMigrationGuard;
export declare const createMigrationGuard: typeof createSequelizeMigrationGuard;

declare const sequelizeMigrationGuard: typeof import("sequelize-migration-guard") & {
  createMigrationGuard: typeof createMigrationGuard;
  createSequelizeMigrationGuard: typeof createSequelizeMigrationGuard;
};

export default sequelizeMigrationGuard;
