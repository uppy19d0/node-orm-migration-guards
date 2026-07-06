import cjs from "./index.cjs";

export const DEFAULT_SEVERITY = cjs.DEFAULT_SEVERITY;
export const MigrationGuardError = cjs.MigrationGuardError;
export const analyzeMigrationPlan = cjs.analyzeMigrationPlan;
export const assertMigrationPlan = cjs.assertMigrationPlan;
export const assertSafeMigration = cjs.assertSafeMigration;
export const checkMigration = cjs.checkMigration;
export const createMigrationGuard = cjs.createMigrationGuard;
export const formatMigrationGuardMessage = cjs.formatMigrationGuardMessage;
export const normalizeIdentifier = cjs.normalizeIdentifier;
export const parseSqlMigration = cjs.parseSqlMigration;
export const splitSqlStatements = cjs.splitSqlStatements;

export default cjs;

