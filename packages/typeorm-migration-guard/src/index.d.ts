import type { MigrationGuardOptions, MigrationGuardResult } from "migration-guard-core";

export interface TypeOrmQueryRunnerLike {
  query(sql: string, ...args: unknown[]): unknown;
  [key: string]: unknown;
}

export interface TypeOrmMigrationLike {
  up(queryRunner: TypeOrmQueryRunnerLike, ...args: unknown[]): unknown;
  [key: string]: unknown;
}

export declare function guardTypeOrmMigrationSql(sql: string, options?: MigrationGuardOptions): MigrationGuardResult;
export declare function assertTypeOrmMigrationSql(sql: string, options?: MigrationGuardOptions): MigrationGuardResult;
export declare function createGuardedQueryRunner<T extends TypeOrmQueryRunnerLike>(queryRunner: T, options?: MigrationGuardOptions): T;
export declare function guardTypeOrmMigrationInstance<T extends TypeOrmMigrationLike>(migration: T, options?: MigrationGuardOptions): T;

declare const typeormMigrationGuard: {
  assertTypeOrmMigrationSql: typeof assertTypeOrmMigrationSql;
  createGuardedQueryRunner: typeof createGuardedQueryRunner;
  guardTypeOrmMigrationInstance: typeof guardTypeOrmMigrationInstance;
  guardTypeOrmMigrationSql: typeof guardTypeOrmMigrationSql;
};

export default typeormMigrationGuard;

