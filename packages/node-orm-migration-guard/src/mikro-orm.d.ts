import type { MigrationGuardOptions } from "migration-guard-core";
import type { MigrationGuardDatabase, NodeOrmMigrationGuard } from "./index.js";

export * from "mikro-orm-migration-guard";

export interface MikroOrmMigrationGuardConfig extends MigrationGuardOptions {
  database?: MigrationGuardDatabase;
}

export declare function createMikroOrmMigrationGuard(config?: MikroOrmMigrationGuardConfig): NodeOrmMigrationGuard;
export declare const createMigrationGuard: typeof createMikroOrmMigrationGuard;

declare const mikroOrmMigrationGuard: typeof import("mikro-orm-migration-guard") & {
  createMigrationGuard: typeof createMigrationGuard;
  createMikroOrmMigrationGuard: typeof createMikroOrmMigrationGuard;
};

export default mikroOrmMigrationGuard;
