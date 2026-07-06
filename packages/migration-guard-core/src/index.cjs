"use strict";

const DEFAULT_SEVERITY = Object.freeze({
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

  return String(value)
    .trim()
    .replace(/,+$/g, "")
    .split(".")
    .map((part) => {
      const trimmed = part.trim();
      if (
        (trimmed.startsWith("\"") && trimmed.endsWith("\"")) ||
        (trimmed.startsWith("`") && trimmed.endsWith("`")) ||
        (trimmed.startsWith("[") && trimmed.endsWith("]"))
      ) {
        return trimmed.slice(1, -1);
      }

      return trimmed;
    })
    .join(".");
}

function normalizeComparable(value) {
  return normalizeIdentifier(value).toLowerCase();
}

function getIdentifierTail(value) {
  const normalized = normalizeComparable(value);
  const parts = normalized.split(".");
  return parts[parts.length - 1] || normalized;
}

function splitSqlStatements(sql) {
  if (typeof sql !== "string") {
    throw new TypeError("Expected SQL to be a string.");
  }

  const statements = [];
  let current = "";
  let quote = null;
  let lineComment = false;
  let blockComment = false;

  for (let index = 0; index < sql.length; index += 1) {
    const char = sql[index];
    const next = sql[index + 1];

    if (lineComment) {
      current += char;
      if (char === "\n") {
        lineComment = false;
      }
      continue;
    }

    if (blockComment) {
      current += char;
      if (char === "*" && next === "/") {
        current += next;
        index += 1;
        blockComment = false;
      }
      continue;
    }

    if (quote) {
      current += char;
      if (char === quote) {
        if (next === quote && (quote === "'" || quote === "\"")) {
          current += next;
          index += 1;
        } else {
          quote = null;
        }
      }
      continue;
    }

    if (char === "-" && next === "-") {
      current += char + next;
      index += 1;
      lineComment = true;
      continue;
    }

    if (char === "/" && next === "*") {
      current += char + next;
      index += 1;
      blockComment = true;
      continue;
    }

    if (char === "'" || char === "\"" || char === "`") {
      current += char;
      quote = char;
      continue;
    }

    if (char === ";") {
      const statement = current.trim();
      if (statement) {
        statements.push(statement);
      }
      current = "";
      continue;
    }

    current += char;
  }

  const last = current.trim();
  if (last) {
    statements.push(last);
  }

  return statements;
}

function stripLeadingSqlComments(statement) {
  let value = String(statement).trim();

  while (value.startsWith("--") || value.startsWith("/*")) {
    if (value.startsWith("--")) {
      const nextLine = value.indexOf("\n");
      if (nextLine === -1) {
        return "";
      }
      value = value.slice(nextLine + 1).trim();
      continue;
    }

    const commentEnd = value.indexOf("*/");
    if (commentEnd === -1) {
      return "";
    }
    value = value.slice(commentEnd + 2).trim();
  }

  return value;
}

function compactSql(statement) {
  return stripLeadingSqlComments(statement).replace(/\s+/g, " ").trim();
}

function splitCommaList(value) {
  return String(value)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function stripTrailingSqlOptions(value) {
  return String(value)
    .replace(/\s+(cascade|restrict)\s*$/i, "")
    .replace(/\s+restart\s+identity\s*$/i, "")
    .replace(/\s+continue\s+identity\s*$/i, "")
    .trim();
}

function parseSqlStatement(statement, source) {
  const sql = compactSql(statement);
  if (!sql) {
    return [];
  }

  const operations = [];
  let match = sql.match(/^drop\s+table\s+(?:if\s+exists\s+)?(.+)$/i);
  if (match) {
    const tableList = stripTrailingSqlOptions(match[1]);
    for (const table of splitCommaList(tableList)) {
      operations.push({
        type: "dropTable",
        table: normalizeIdentifier(table),
        rawSql: statement,
        source
      });
    }
    return operations;
  }

  match = sql.match(/^truncate\s+(?:table\s+)?(.+)$/i);
  if (match) {
    const tableList = stripTrailingSqlOptions(match[1]);
    for (const table of splitCommaList(tableList)) {
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
  return splitSqlStatements(sql).flatMap((statement) => parseSqlStatement(statement, options.source || "sql"));
}

function normalizeOperation(operation) {
  if (!operation || typeof operation !== "object") {
    throw new TypeError("Migration operations must be objects.");
  }

  const type = operation.type || operation.kind;
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

function identifierMatches(value, patterns) {
  if (!value || !patterns) {
    return false;
  }

  const normalized = normalizeComparable(value);
  const tail = getIdentifierTail(value);

  return list(patterns).some((pattern) => {
    const expected = normalizeComparable(pattern);
    return expected === normalized || expected === tail;
  });
}

function operationMatchesPattern(operation, pattern) {
  if (!pattern) {
    return false;
  }

  const normalized = normalizeComparable(pattern);
  const table = operation.table ? normalizeComparable(operation.table) : "";
  const column = operation.column ? normalizeComparable(operation.column) : "";
  const tableColumn = table && column ? `${table}.${column}` : "";
  const tailTableColumn = table && column ? `${getIdentifierTail(table)}.${getIdentifierTail(column)}` : "";

  return normalized === table || normalized === getIdentifierTail(table) || normalized === column || normalized === getIdentifierTail(column) || normalized === tableColumn || normalized === tailTableColumn;
}

function isExplicitlyAllowed(value, operation) {
  if (value === true) {
    return true;
  }

  if (!Array.isArray(value)) {
    return false;
  }

  return value.some((pattern) => operationMatchesPattern(operation, pattern));
}

function isIgnoredOperation(operation, options) {
  return identifierMatches(operation.table, options.ignoreTables) || identifierMatches(operation.column, options.ignoreColumns);
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

  for (const operation of operations) {
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

