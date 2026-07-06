import type { MigrationGuardOptions, MigrationGuardResult } from "migration-guard-core";

export interface SequelizeQueryInterfaceLike {
  dropTable?(tableName: unknown, ...args: unknown[]): unknown;
  removeColumn?(tableName: unknown, columnName: string, ...args: unknown[]): unknown;
  renameTable?(before: unknown, after: unknown, ...args: unknown[]): unknown;
  renameColumn?(tableName: unknown, before: string, after: string, ...args: unknown[]): unknown;
  sequelize?: {
    query(sql: string, ...args: unknown[]): unknown;
  };
  [key: string]: unknown;
}

export declare function guardSequelizeMigrationSql(sql: string, options?: MigrationGuardOptions): MigrationGuardResult;
export declare function assertSequelizeMigrationSql(sql: string, options?: MigrationGuardOptions): MigrationGuardResult;
export declare function createGuardedQueryInterface<T extends SequelizeQueryInterfaceLike>(queryInterface: T, options?: MigrationGuardOptions): T;

declare const sequelizeMigrationGuard: {
  assertSequelizeMigrationSql: typeof assertSequelizeMigrationSql;
  createGuardedQueryInterface: typeof createGuardedQueryInterface;
  guardSequelizeMigrationSql: typeof guardSequelizeMigrationSql;
};

export default sequelizeMigrationGuard;

