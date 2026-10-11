"use strict";

const { scanSql, limit, splitActions, splitIdentifier } = require("./sql-lexer.cjs");

const DEFAULT_SEVERITY = Object.freeze({
  unrecognizedOperation: "error",
  dropTable: "error",
  dropColumn: "error",
  truncateTable: "error",
  renameTable: "warning",
  renameColumn: "warning",
  addNotNullColumnWithoutDefault: "warning",
  blockedTable: "error",
  blockedColumn: "error"
});

const IDENTIFIER_PATTERN = "(?:\"[^\"]+\"|`[^`]+`|\\[[^\\]]+\\]|[A-Za-z_][\\w$]*(?:\\.[A-Za-z_][\\w$]*)?)";

class MigrationGuardError extends Error {
  constructor(result, message) {
    super(message || formatMigrationGuardMessage(result));
    this.name = "MigrationGuardError";
    this.result = result;
  }
}

function normalizeIdentifier(value) {
  if (value == null) {
    return "";
  }

  const trimmedValue = String(value).trim();
  let end = trimmedValue.length;
  while (end > 0 && trimmedValue[end - 1] === ",") {
    end -= 1;
  }

  return splitIdentifier(trimmedValue.slice(0, end))
    .map((part) => {
      const trimmed = part.trim();
      if (
        (trimmed.startsWith("\"") && trimmed.endsWith("\"")) ||
        (trimmed.startsWith("`") && trimmed.endsWith("`")) ||
        (trimmed.startsWith("[") && trimmed.endsWith("]"))
      ) {
        const closing = trimmed.endsWith("]") ? "]" : trimmed[0];
        const identifier = trimmed.slice(1, -1).split(closing + closing).join(closing);
        if (identifier.includes(".") || identifier !== identifier.trim()) {
          throw new TypeError("Quoted identifiers containing dots or edge whitespace require separate review.");
        }
        return identifier;
      }

      return trimmed;
    })
    .join(".");
}

function normalizeComparable(value) {
  return normalizeIdentifier(value).toLowerCase();
}

function getIdentifierTail(value, caseSensitive = false) {
  const normalized = caseSensitive ? normalizeIdentifier(value) : normalizeComparable(value);
  const parts = normalized.split(".");
  return parts[parts.length - 1] || normalized;
}

function splitSqlStatements(sql, options = {}) {
  return scanSql(sql, options).map(statement => statement.raw);
}

function compactSql(statement) {
  const items = scanSql(statement);
  return items.map(item => item.canonical).join("; ").trim();
}

function splitCommaList(value, maxOperations) {
  const parts = splitActions(String(value), maxOperations);
  if (parts.length > maxOperations) throw new RangeError("SQL exceeds maxOperations.");
  return parts
    .map((item) => item.trim())
    .filter(Boolean);
}

// The SQL prefix and suffix parsers receive whitespace normalized by compactSql.
function stripTrailingSqlOptions(value) {
  return String(value)
    .replace(/ (cascade|restrict)$/i, "")
    .replace(/ restart identity$/i, "")
    .replace(/ continue identity$/i, "")
    .trim();
}

function parseSqlStatement(statement, source, options, canonical) {
  const sql = canonical === undefined ? compactSql(statement) : canonical.trim();
  if (!sql) {
    return [];
  }

  const operations = [];
  let match = sql.match(/^drop table (?:if exists )?(.+)$/i);
  if (match) {
    const tableList = stripTrailingSqlOptions(match[1]);
    for (const table of splitCommaList(tableList, limit(options.maxOperations, 10_000, "maxOperations"))) {
      operations.push({
        type: "dropTable",
        table: normalizeIdentifier(table),
        rawSql: statement,
        source
      });
    }
    return operations;
  }

  match = sql.match(/^truncate (?:table )?(.+)$/i);
  if (match) {
    const tableList = stripTrailingSqlOptions(match[1]);
    for (const table of splitCommaList(tableList, limit(options.maxOperations, 10_000, "maxOperations"))) {
      operations.push({
        type: "truncateTable",
        table: normalizeIdentifier(table),
        rawSql: statement,
        source
      });
    }
    return operations;
  }

  const alterTable = sql.match(new RegExp(`^alter\\s+table\\s+(?:if\\s+exists\\s+)?(${IDENTIFIER_PATTERN})\\s+(.+)$`, "i"));
  if (alterTable) {
    const table = normalizeIdentifier(alterTable[1]);
    const action = alterTable[2];
    const actions = splitActions(action);
    if (actions.length > limit(options.maxOperations, 10_000, "maxOperations")) throw new RangeError("SQL exceeds maxOperations.");
    if (actions.length > 1) {
      return actions.flatMap(item => parseSqlStatement(`ALTER TABLE ${alterTable[1]} ${item}`, source, options))
        .map(operation => ({ ...operation, rawSql: statement }));
    }

    match = action.match(new RegExp(`^drop\\s+column\\s+(?:if\\s+exists\\s+)?(${IDENTIFIER_PATTERN})`, "i"));
    if (match) {
      operations.push({
        type: "dropColumn",
        table,
        column: normalizeIdentifier(match[1]),
        rawSql: statement,
        source
      });
      return operations;
    }

    match = action.match(new RegExp(`^rename\\s+column\\s+(${IDENTIFIER_PATTERN})\\s+to\\s+(${IDENTIFIER_PATTERN})`, "i"));
    if (match) {
      operations.push({
        type: "renameColumn",
        table,
        column: normalizeIdentifier(match[1]),
        toColumn: normalizeIdentifier(match[2]),
        rawSql: statement,
        source
      });
      return operations;
    }

    match = action.match(new RegExp(`^rename\\s+to\\s+(${IDENTIFIER_PATTERN})`, "i"));
    if (match) {
      operations.push({
        type: "renameTable",
        table,
        toTable: normalizeIdentifier(match[1]),
        rawSql: statement,
        source
      });
      return operations;
    }

    match = action.match(new RegExp(`^add\\s+column\\s+(?:if\\s+not\\s+exists\\s+)?(${IDENTIFIER_PATTERN})\\s+(.+)$`, "i"));
    if (match) {
      const definition = match[2];
      operations.push({
        type: "addColumn",
        table,
        column: normalizeIdentifier(match[1]),
        nullable: !/\bnot\s+null\b/i.test(definition),
        hasDefault: /\bdefault\b/i.test(definition),
        rawSql: statement,
        source
      });
      return operations;
    }
  }

  return [{
    type: "rawSql",
    rawSql: statement,
    source
  }];
}

function parseSqlMigration(sql, options = {}) {
  const maxOperations = limit(options.maxOperations, 10_000, "maxOperations");
  const operations = [];
  for (const statement of scanSql(sql, options)) {
    const parsed = parseSqlStatement(statement.raw, options.source || "sql", options, statement.canonical);
    if (operations.length + parsed.length > maxOperations) throw new RangeError("SQL exceeds maxOperations.");
    operations.push(...parsed);
  }
  return operations;
}

function normalizeOperation(operation) {
  if (!operation || typeof operation !== "object" || Array.isArray(operation)) {
    throw new TypeError("Migration operations must be objects.");
  }

  const type = Object.hasOwn(operation, "type") ? operation.type : Object.hasOwn(operation, "kind") ? operation.kind : undefined;
  for (const field of ["table", "column", "toTable", "toColumn", "rawSql", "source"]) {
    if (Object.hasOwn(operation, field) && operation[field] != null && typeof operation[field] !== "string") {
      throw new TypeError(`Operation ${field} must be a string.`);
    }
  }
  for (const field of ["nullable", "hasDefault"]) {
    if (Object.hasOwn(operation, field) && typeof operation[field] !== "boolean") throw new TypeError(`Operation ${field} must be boolean.`);
  }
  const required = { dropTable: ["table"], truncateTable: ["table"], renameTable: ["table", "toTable"], dropColumn: ["table", "column"], renameColumn: ["table", "column", "toColumn"], addColumn: ["table", "column"] };
  if (Object.hasOwn(required, type)) {
    for (const field of required[type]) {
      if (!Object.hasOwn(operation, field) || typeof operation[field] !== "string" || !operation[field].trim()) throw new TypeError(`Operation ${type} requires ${field}.`);
    }
  }
  if (!type || typeof type !== "string") {
    throw new TypeError("Migration operations must include a string type.");
  }

  return {
    ...operation,
    type,
    table: operation.table == null ? undefined : normalizeIdentifier(operation.table),
    column: operation.column == null ? undefined : normalizeIdentifier(operation.column),
    toTable: operation.toTable == null ? undefined : normalizeIdentifier(operation.toTable),
    toColumn: operation.toColumn == null ? undefined : normalizeIdentifier(operation.toColumn)
  };
}

function toOperationList(input, options) {
  if (typeof input === "string") {
    return parseSqlMigration(input, options).map(normalizeOperation);
  }

  if (!Array.isArray(input)) {
    throw new TypeError("Expected SQL string or an array of migration operations.");
  }

  if (input.length > limit(options.maxOperations, 10_000, "maxOperations")) throw new RangeError("Plan exceeds maxOperations.");
  return input.map(normalizeOperation);
}

function list(value) {
  if (!value) {
    return [];
  }

  return Array.isArray(value) ? value : [value];
}

function hasRuleDisabled(ruleId, options) {
  const ignoredRules = list(options.ignoredRules);
  return ignoredRules.includes(ruleId);
}

function getRuleSeverity(ruleId, options) {
  if (hasRuleDisabled(ruleId, options)) {
    return "off";
  }

  const override = options.severityOverrides && options.severityOverrides[ruleId];
  if (override === false || override === "off") {
    return "off";
  }

  if (override === "warn") {
    return "warning";
  }

  if (override === "warning" || override === "error") {
    return override;
  }

  return DEFAULT_SEVERITY[ruleId] || "error";
}

function identifierMatches(value, patterns, caseSensitive = false) {
  if (!value || !patterns) {
    return false;
  }

  const normalized = caseSensitive ? normalizeIdentifier(value) : normalizeComparable(value);
  const tail = getIdentifierTail(value, caseSensitive);

  return list(patterns).some((pattern) => {
    const expected = caseSensitive ? normalizeIdentifier(pattern) : normalizeComparable(pattern);
    return expected === normalized || expected === tail;
  });
}

function operationMatchesPattern(operation, pattern, caseSensitive = false) {
  if (!pattern) {
    return false;
  }

  const comparable = caseSensitive ? normalizeIdentifier : normalizeComparable;
  const normalized = comparable(pattern);
  const table = operation.table ? comparable(operation.table) : "";
  const column = operation.column ? comparable(operation.column) : "";
  const tableColumn = table && column ? `${table}.${column}` : "";
  const tailTableColumn = table && column ? `${getIdentifierTail(table, caseSensitive)}.${getIdentifierTail(column, caseSensitive)}` : "";

  return normalized === table || normalized === getIdentifierTail(table, caseSensitive) || normalized === column || normalized === getIdentifierTail(column, caseSensitive) || normalized === tableColumn || normalized === tailTableColumn;
}

function isExplicitlyAllowed(value, operation) {
  if (value === true) {
    return true;
  }

  if (!Array.isArray(value)) {
    return false;
  }

  return value.some((pattern) => operationMatchesPattern(operation, pattern, true));
}

function isIgnoredOperation(operation, options) {
  return identifierMatches(operation.table, options.ignoreTables, true) || identifierMatches(operation.column, options.ignoreColumns, true);
}

function analyzeMigrationPlan(input, options = {}) {
  const operations = toOperationList(input, options);
  const violations = [];

  function addViolation(ruleId, operation, message) {
    const severity = getRuleSeverity(ruleId, options);
    if (severity === "off") {
      return;
    }

    violations.push({
      ruleId,
      severity,
      message,
      operation,
      source: operation.source,
      table: operation.table,
      column: operation.column
    });
  }

  const recognizedTypes = new Set(["dropTable", "dropColumn", "truncateTable", "renameTable", "renameColumn", "addColumn"]);
  for (const operation of operations) {
    if (options.allowUnrecognized === false && !recognizedTypes.has(operation.type)) {
      addViolation("unrecognizedOperation", operation, "Operation is outside the supported migration grammar and requires explicit review.");
      continue;
    }
    if (isIgnoredOperation(operation, options)) {
      continue;
    }

    if (identifierMatches(operation.table, options.blockedTables)) {
      addViolation("blockedTable", operation, `Table "${operation.table}" is blocked by policy.`);
    }

    if (identifierMatches(operation.column, options.blockedColumns) || operationMatchesPattern(operation, options.blockedColumns)) {
      addViolation("blockedColumn", operation, `Column "${operation.column || operation.table}" is blocked by policy.`);
    }

    if (operation.type === "dropTable" && !isExplicitlyAllowed(options.allowDropTable, operation)) {
      addViolation("dropTable", operation, `Dropping table "${operation.table}" can permanently remove data.`);
    }

    if (operation.type === "dropColumn" && !isExplicitlyAllowed(options.allowDropColumn, operation)) {
      addViolation("dropColumn", operation, `Dropping column "${operation.column}" from "${operation.table}" can permanently remove data.`);
    }

    if (operation.type === "truncateTable" && !isExplicitlyAllowed(options.allowTruncate, operation)) {
      addViolation("truncateTable", operation, `Truncating table "${operation.table}" can permanently remove data.`);
    }

    if (operation.type === "renameTable" && !isExplicitlyAllowed(options.allowRenameTable, operation)) {
      addViolation("renameTable", operation, `Renaming table "${operation.table}" to "${operation.toTable}" can break running application versions.`);
    }

    if (operation.type === "renameColumn" && !isExplicitlyAllowed(options.allowRenameColumn, operation)) {
      addViolation("renameColumn", operation, `Renaming column "${operation.column}" to "${operation.toColumn}" can break running application versions.`);
    }

    if (
      operation.type === "addColumn" &&
      operation.nullable === false &&
      operation.hasDefault === false &&
      !isExplicitlyAllowed(options.allowAddNotNullColumnWithoutDefault, operation)
    ) {
      addViolation("addNotNullColumnWithoutDefault", operation, `Adding NOT NULL column "${operation.column}" to "${operation.table}" without a default may fail on non-empty tables.`);
    }
  }

  const hasErrors = violations.some((violation) => violation.severity === "error");
  const hasWarnings = violations.some((violation) => violation.severity === "warning");

  return {
    passed: !hasErrors && !(options.failOnWarnings && hasWarnings),
    operations,
    violations,
    hasErrors,
    hasWarnings
  };
}

function formatViolation(violation) {
  const target = [violation.table, violation.column].filter(Boolean).join(".");
  const source = violation.source ? ` (${violation.source})` : "";
  const suffix = target ? ` ${target}` : "";
  return `[${violation.severity}] ${violation.ruleId}${suffix}${source}: ${violation.message}`;
}

function formatMigrationGuardMessage(result) {
  if (!result || !Array.isArray(result.violations) || result.violations.length === 0) {
    return "Migration guard failed.";
  }

  return [
    `Migration guard found ${result.violations.length} issue${result.violations.length === 1 ? "" : "s"}.`,
    ...result.violations.map(formatViolation)
  ].join("\n");
}

function assertMigrationPlan(input, options = {}) {
  const result = analyzeMigrationPlan(input, options);
  if (!result.passed) {
    throw new MigrationGuardError(result);
  }

  return result;
}

function checkMigration(input, options = {}) {
  return analyzeMigrationPlan(input, options);
}

function assertSafeMigration(input, options = {}) {
  return assertMigrationPlan(input, options);
}

function createMigrationGuard(defaultOptions = {}) {
  return {
    check(input, options = {}) {
      return checkMigration(input, { ...defaultOptions, ...options });
    },
    assert(input, options = {}) {
      return assertSafeMigration(input, { ...defaultOptions, ...options });
    }
  };
}

module.exports = {
  DEFAULT_SEVERITY,
  MigrationGuardError,
  analyzeMigrationPlan,
  assertMigrationPlan,
  assertSafeMigration,
  checkMigration,
  createMigrationGuard,
  formatMigrationGuardMessage,
  normalizeIdentifier,
  parseSqlMigration,
  splitSqlStatements
};

