import type { MigrationGuardOptions, MigrationGuardResult } from "migration-guard-core";

export interface DrizzleMigrationDirectoryResult extends MigrationGuardResult {
  files: string[];
}

export interface DrizzleDatabaseLike {
  execute?(sql: unknown, ...args: unknown[]): unknown;
  run?(sql: unknown, ...args: unknown[]): unknown;
  all?(sql: unknown, ...args: unknown[]): unknown;
  get?(sql: unknown, ...args: unknown[]): unknown;
  values?(sql: unknown, ...args: unknown[]): unknown;
  [key: string]: unknown;
}

export declare function extractDrizzleSqlText(input: unknown): string | null;
export declare function guardDrizzleMigrationSql(sql: string, options?: MigrationGuardOptions): MigrationGuardResult;
export declare function assertDrizzleMigrationSql(sql: string, options?: MigrationGuardOptions): MigrationGuardResult;
export declare function guardDrizzleMigrationFile(file: string, options?: MigrationGuardOptions): MigrationGuardResult;
export declare function assertDrizzleMigrationFile(file: string, options?: MigrationGuardOptions): MigrationGuardResult;
export declare function guardDrizzleMigrationDirectory(directory: string, options?: MigrationGuardOptions): DrizzleMigrationDirectoryResult;
export declare function assertDrizzleMigrationDirectory(directory: string, options?: MigrationGuardOptions): DrizzleMigrationDirectoryResult;
export declare function createGuardedDrizzle<T extends DrizzleDatabaseLike>(database: T, options?: MigrationGuardOptions): T;

declare const drizzleMigrationGuard: {
  assertDrizzleMigrationDirectory: typeof assertDrizzleMigrationDirectory;
  assertDrizzleMigrationFile: typeof assertDrizzleMigrationFile;
  assertDrizzleMigrationSql: typeof assertDrizzleMigrationSql;
  createGuardedDrizzle: typeof createGuardedDrizzle;
  extractDrizzleSqlText: typeof extractDrizzleSqlText;
  guardDrizzleMigrationDirectory: typeof guardDrizzleMigrationDirectory;
  guardDrizzleMigrationFile: typeof guardDrizzleMigrationFile;
  guardDrizzleMigrationSql: typeof guardDrizzleMigrationSql;
};

export default drizzleMigrationGuard;

