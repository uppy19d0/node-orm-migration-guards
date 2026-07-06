import type { MigrationGuardOptions, MigrationGuardResult } from "migration-guard-core";

export interface KnexLike {
  raw(sql: unknown, ...args: unknown[]): unknown;
  schema: Record<string, unknown>;
  (...args: unknown[]): unknown;
  [key: string]: unknown;
}

export declare function guardKnexMigrationSql(sql: string, options?: MigrationGuardOptions): MigrationGuardResult;
export declare function assertKnexMigrationSql(sql: string, options?: MigrationGuardOptions): MigrationGuardResult;
export declare function createGuardedKnex<T extends KnexLike>(knex: T, options?: MigrationGuardOptions): T;

declare const knexMigrationGuard: {
  assertKnexMigrationSql: typeof assertKnexMigrationSql;
  createGuardedKnex: typeof createGuardedKnex;
  guardKnexMigrationSql: typeof guardKnexMigrationSql;
};

export default knexMigrationGuard;

