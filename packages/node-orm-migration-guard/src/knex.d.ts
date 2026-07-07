import type { MigrationGuardOptions } from "migration-guard-core";
import type { MigrationGuardDatabase, NodeOrmMigrationGuard } from "./index.js";

export * from "knex-migration-guard";

export interface KnexMigrationGuardConfig extends MigrationGuardOptions {
  database?: MigrationGuardDatabase;
}

export declare function createKnexMigrationGuard(config?: KnexMigrationGuardConfig): NodeOrmMigrationGuard;
export declare const createMigrationGuard: typeof createKnexMigrationGuard;

declare const knexMigrationGuard: typeof import("knex-migration-guard") & {
  createKnexMigrationGuard: typeof createKnexMigrationGuard;
  createMigrationGuard: typeof createMigrationGuard;
};

export default knexMigrationGuard;
