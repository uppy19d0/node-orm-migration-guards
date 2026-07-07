import type { MigrationGuardOptions } from "migration-guard-core";
import type { MigrationGuardDatabase, NodeOrmMigrationGuard } from "./index.js";

export * from "typeorm-migration-guard";

export interface TypeOrmMigrationGuardConfig extends MigrationGuardOptions {
  database?: MigrationGuardDatabase;
}

export declare function createTypeOrmMigrationGuard(config?: TypeOrmMigrationGuardConfig): NodeOrmMigrationGuard;
export declare const createMigrationGuard: typeof createTypeOrmMigrationGuard;

declare const typeormMigrationGuard: typeof import("typeorm-migration-guard") & {
  createMigrationGuard: typeof createMigrationGuard;
  createTypeOrmMigrationGuard: typeof createTypeOrmMigrationGuard;
};

export default typeormMigrationGuard;
