import type { MigrationGuardOptions, MigrationGuardResult } from "migration-guard-core";

export interface MikroOrmMigrationLike {
  addSql(sql: string, ...args: unknown[]): unknown;
  up?(...args: unknown[]): unknown;
  down?(...args: unknown[]): unknown;
  [key: string]: unknown;
}

export declare function guardMikroOrmMigrationSql(sql: string, options?: MigrationGuardOptions): MigrationGuardResult;
export declare function assertMikroOrmMigrationSql(sql: string, options?: MigrationGuardOptions): MigrationGuardResult;
export declare function createGuardedMikroOrmMigration<T extends MikroOrmMigrationLike>(migration: T, options?: MigrationGuardOptions): T;

declare const mikroOrmMigrationGuard: {
  assertMikroOrmMigrationSql: typeof assertMikroOrmMigrationSql;
  createGuardedMikroOrmMigration: typeof createGuardedMikroOrmMigration;
  guardMikroOrmMigrationSql: typeof guardMikroOrmMigrationSql;
};

export default mikroOrmMigrationGuard;

