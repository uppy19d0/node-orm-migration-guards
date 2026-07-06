import type { MigrationGuardOptions, MigrationGuardResult } from "migration-guard-core";

export interface PrismaMigrationSql {
  path: string;
  sql: string;
}

export interface PrismaMigrationDirectoryResult extends MigrationGuardResult {
  files: string[];
}

export declare function guardPrismaMigrationSql(sql: string, options?: MigrationGuardOptions): MigrationGuardResult;
export declare function assertPrismaMigrationSql(sql: string, options?: MigrationGuardOptions): MigrationGuardResult;
export declare function readPrismaMigrationSql(fileOrDirectory: string): PrismaMigrationSql;
export declare function guardPrismaMigrationFile(fileOrDirectory: string, options?: MigrationGuardOptions): MigrationGuardResult;
export declare function assertPrismaMigrationFile(fileOrDirectory: string, options?: MigrationGuardOptions): MigrationGuardResult;
export declare function guardPrismaMigrationDirectory(directory: string, options?: MigrationGuardOptions): PrismaMigrationDirectoryResult;
export declare function assertPrismaMigrationDirectory(directory: string, options?: MigrationGuardOptions): PrismaMigrationDirectoryResult;

declare const prismaMigrationGuard: {
  assertPrismaMigrationDirectory: typeof assertPrismaMigrationDirectory;
  assertPrismaMigrationFile: typeof assertPrismaMigrationFile;
  assertPrismaMigrationSql: typeof assertPrismaMigrationSql;
  guardPrismaMigrationDirectory: typeof guardPrismaMigrationDirectory;
  guardPrismaMigrationFile: typeof guardPrismaMigrationFile;
  guardPrismaMigrationSql: typeof guardPrismaMigrationSql;
  readPrismaMigrationSql: typeof readPrismaMigrationSql;
};

export default prismaMigrationGuard;

