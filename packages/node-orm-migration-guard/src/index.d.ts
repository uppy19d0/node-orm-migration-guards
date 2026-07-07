import type {
  MigrationGuardOptions,
  MigrationGuardResult,
  MigrationOperation
} from "migration-guard-core";
import type { DrizzleDatabaseLike, DrizzleMigrationDirectoryResult } from "drizzle-migration-guard";
import type { KnexLike } from "knex-migration-guard";
import type { MikroOrmMigrationLike } from "mikro-orm-migration-guard";
import type { PrismaMigrationDirectoryResult, PrismaMigrationSql } from "prisma-migration-guard";
import type { SequelizeQueryInterfaceLike } from "sequelize-migration-guard";
import type { TypeOrmMigrationLike, TypeOrmQueryRunnerLike } from "typeorm-migration-guard";

export * from "migration-guard-core";
export { createMigrationGuard as createCoreMigrationGuard } from "migration-guard-core";
export {
  assertDrizzleMigrationDirectory,
  assertDrizzleMigrationFile,
  assertDrizzleMigrationSql,
  createGuardedDrizzle,
  extractDrizzleSqlText,
  guardDrizzleMigrationDirectory,
  guardDrizzleMigrationFile,
  guardDrizzleMigrationSql
} from "drizzle-migration-guard";
export {
  assertKnexMigrationSql,
  createGuardedKnex,
  guardKnexMigrationSql
} from "knex-migration-guard";
export {
  assertMikroOrmMigrationSql,
  createGuardedMikroOrmMigration,
  guardMikroOrmMigrationSql
} from "mikro-orm-migration-guard";
export {
  assertPrismaMigrationDirectory,
  assertPrismaMigrationFile,
  assertPrismaMigrationSql,
  guardPrismaMigrationDirectory,
  guardPrismaMigrationFile,
  guardPrismaMigrationSql,
  readPrismaMigrationSql
} from "prisma-migration-guard";
export {
  assertSequelizeMigrationSql,
  createGuardedQueryInterface,
  guardSequelizeMigrationSql
} from "sequelize-migration-guard";
export {
  assertTypeOrmMigrationSql,
  createGuardedQueryRunner,
  guardTypeOrmMigrationInstance,
  guardTypeOrmMigrationSql
} from "typeorm-migration-guard";

export type MigrationGuardOrm =
  | "drizzle"
  | "drizzle-orm"
  | "knex"
  | "objection"
  | "objection.js"
  | "mikro"
  | "mikro-orm"
  | "mikroorm"
  | "prisma"
  | "prisma-migrate"
  | "sequelize"
  | "typeorm"
  | "type-orm";

export type NormalizedMigrationGuardOrm =
  | "drizzle"
  | "knex"
  | "mikro-orm"
  | "prisma"
  | "sequelize"
  | "typeorm";

export type MigrationGuardDatabase =
  | "cockroach"
  | "cockroachdb"
  | "maria"
  | "mariadb"
  | "mssql"
  | "mysql"
  | "pg"
  | "postgres"
  | "postgresql"
  | "sqlite"
  | "sqlite3"
  | "sqlserver"
  | (string & {});

export interface NodeOrmMigrationGuardConfig extends MigrationGuardOptions {
  orm: MigrationGuardOrm;
  database?: MigrationGuardDatabase;
}

export interface NodeOrmMigrationGuard {
  orm: NormalizedMigrationGuardOrm;
  database?: string;
  checkSql(sql: string, options?: MigrationGuardOptions): MigrationGuardResult;
  assertSql(sql: string, options?: MigrationGuardOptions): MigrationGuardResult;
  check(input: string | MigrationOperation[], options?: MigrationGuardOptions): MigrationGuardResult;
  assert(input: string | MigrationOperation[], options?: MigrationGuardOptions): MigrationGuardResult;
  checkFile(file: string, options?: MigrationGuardOptions): MigrationGuardResult;
  assertFile(file: string, options?: MigrationGuardOptions): MigrationGuardResult;
  checkDirectory(directory: string, options?: MigrationGuardOptions): DrizzleMigrationDirectoryResult | PrismaMigrationDirectoryResult;
  assertDirectory(directory: string, options?: MigrationGuardOptions): DrizzleMigrationDirectoryResult | PrismaMigrationDirectoryResult;
  wrap<T extends DrizzleDatabaseLike | KnexLike | MikroOrmMigrationLike | SequelizeQueryInterfaceLike | TypeOrmQueryRunnerLike>(target: T, options?: MigrationGuardOptions): T;
  wrapMigration<T extends MikroOrmMigrationLike | TypeOrmMigrationLike>(migration: T, options?: MigrationGuardOptions): T;
}

export interface ResolvedMigrationGuardAdapter {
  orm: NormalizedMigrationGuardOrm;
  adapter: Record<string, unknown>;
}

export declare function createMigrationGuard(config: NodeOrmMigrationGuardConfig): NodeOrmMigrationGuard;
export declare function getSupportedOrms(): NormalizedMigrationGuardOrm[];
export declare function getSupportedDatabases(): string[];
export declare function resolveAdapter(orm: MigrationGuardOrm): ResolvedMigrationGuardAdapter;

declare const nodeOrmMigrationGuard: {
  createCoreMigrationGuard: typeof import("migration-guard-core").createMigrationGuard;
  createMigrationGuard: typeof createMigrationGuard;
  getSupportedDatabases: typeof getSupportedDatabases;
  getSupportedOrms: typeof getSupportedOrms;
  resolveAdapter: typeof resolveAdapter;
};

export type { PrismaMigrationSql };
export default nodeOrmMigrationGuard;
