export type MigrationRuleId =
  | "dropTable"
  | "dropColumn"
  | "truncateTable"
  | "renameTable"
  | "renameColumn"
  | "addNotNullColumnWithoutDefault"
  | "blockedTable"
  | "blockedColumn";

export type MigrationSeverity = "warning" | "error";
export type RuleSeverityOverride = MigrationSeverity | "warn" | "off" | false;

export type MigrationOperationType =
  | "addColumn"
  | "dropColumn"
  | "dropTable"
  | "rawSql"
  | "renameColumn"
  | "renameTable"
  | "truncateTable"
  | string;

export interface MigrationOperation {
  type: MigrationOperationType;
  kind?: MigrationOperationType;
  table?: string;
  column?: string;
  toTable?: string;
  toColumn?: string;
  rawSql?: string;
  source?: string;
  nullable?: boolean;
  hasDefault?: boolean;
  [key: string]: unknown;
}

export interface ParseSqlMigrationOptions {
  source?: string;
}

export interface MigrationGuardOptions extends ParseSqlMigrationOptions {
  allowDropTable?: boolean | string[];
  allowDropColumn?: boolean | string[];
  allowTruncate?: boolean | string[];
  allowRenameTable?: boolean | string[];
  allowRenameColumn?: boolean | string[];
  allowAddNotNullColumnWithoutDefault?: boolean | string[];
  blockedTables?: string | string[];
  blockedColumns?: string | string[];
  ignoreTables?: string | string[];
  ignoreColumns?: string | string[];
  ignoredRules?: MigrationRuleId[];
  failOnWarnings?: boolean;
  severityOverrides?: Partial<Record<MigrationRuleId, RuleSeverityOverride>>;
}

export interface MigrationViolation {
  ruleId: MigrationRuleId;
  severity: MigrationSeverity;
  message: string;
  operation: MigrationOperation;
  source?: string;
  table?: string;
  column?: string;
}

export interface MigrationGuardResult {
  passed: boolean;
  operations: MigrationOperation[];
  violations: MigrationViolation[];
  hasErrors: boolean;
  hasWarnings: boolean;
}

export declare const DEFAULT_SEVERITY: Readonly<Record<MigrationRuleId, MigrationSeverity>>;

export declare class MigrationGuardError extends Error {
  name: "MigrationGuardError";
  result: MigrationGuardResult;
  constructor(result: MigrationGuardResult, message?: string);
}

export declare function splitSqlStatements(sql: string): string[];
export declare function parseSqlMigration(sql: string, options?: ParseSqlMigrationOptions): MigrationOperation[];
export declare function normalizeIdentifier(value: unknown): string;
export declare function analyzeMigrationPlan(input: string | MigrationOperation[], options?: MigrationGuardOptions): MigrationGuardResult;
export declare function checkMigration(input: string | MigrationOperation[], options?: MigrationGuardOptions): MigrationGuardResult;
export declare function assertMigrationPlan(input: string | MigrationOperation[], options?: MigrationGuardOptions): MigrationGuardResult;
export declare function assertSafeMigration(input: string | MigrationOperation[], options?: MigrationGuardOptions): MigrationGuardResult;
export declare function formatMigrationGuardMessage(result: MigrationGuardResult): string;
export declare function createMigrationGuard(defaultOptions?: MigrationGuardOptions): {
  check(input: string | MigrationOperation[], options?: MigrationGuardOptions): MigrationGuardResult;
  assert(input: string | MigrationOperation[], options?: MigrationGuardOptions): MigrationGuardResult;
};

declare const migrationGuardCore: {
  DEFAULT_SEVERITY: typeof DEFAULT_SEVERITY;
  MigrationGuardError: typeof MigrationGuardError;
  analyzeMigrationPlan: typeof analyzeMigrationPlan;
  assertMigrationPlan: typeof assertMigrationPlan;
  assertSafeMigration: typeof assertSafeMigration;
  checkMigration: typeof checkMigration;
  createMigrationGuard: typeof createMigrationGuard;
  formatMigrationGuardMessage: typeof formatMigrationGuardMessage;
  normalizeIdentifier: typeof normalizeIdentifier;
  parseSqlMigration: typeof parseSqlMigration;
  splitSqlStatements: typeof splitSqlStatements;
};

export default migrationGuardCore;

