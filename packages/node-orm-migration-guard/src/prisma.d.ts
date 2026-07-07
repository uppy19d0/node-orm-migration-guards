import type { MigrationGuardOptions } from "migration-guard-core";
import type { MigrationGuardDatabase, NodeOrmMigrationGuard } from "./index.js";

export * from "prisma-migration-guard";

export interface PrismaMigrationGuardConfig extends MigrationGuardOptions {
  database?: MigrationGuardDatabase;
}

export declare function createPrismaMigrationGuard(config?: PrismaMigrationGuardConfig): NodeOrmMigrationGuard;
export declare const createMigrationGuard: typeof createPrismaMigrationGuard;

declare const prismaMigrationGuard: typeof import("prisma-migration-guard") & {
  createMigrationGuard: typeof createMigrationGuard;
  createPrismaMigrationGuard: typeof createPrismaMigrationGuard;
};

export default prismaMigrationGuard;
