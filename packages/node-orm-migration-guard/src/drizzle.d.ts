import type { MigrationGuardOptions } from "migration-guard-core";
import type { MigrationGuardDatabase, NodeOrmMigrationGuard } from "./index.js";

export * from "drizzle-migration-guard";

export interface DrizzleMigrationGuardConfig extends MigrationGuardOptions {
  database?: MigrationGuardDatabase;
}

export declare function createDrizzleMigrationGuard(config?: DrizzleMigrationGuardConfig): NodeOrmMigrationGuard;
export declare const createMigrationGuard: typeof createDrizzleMigrationGuard;

declare const drizzleMigrationGuard: typeof import("drizzle-migration-guard") & {
  createDrizzleMigrationGuard: typeof createDrizzleMigrationGuard;
  createMigrationGuard: typeof createMigrationGuard;
};

export default drizzleMigrationGuard;
