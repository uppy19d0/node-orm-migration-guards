"use strict";

function limit(value, fallback, name) {
  const result = value ?? fallback;
  if (!Number.isSafeInteger(result) || result < 1) throw new TypeError(`${name} must be a positive safe integer.`);
  return result;
}

/** Bounded lexical scan, not a database-specific SQL grammar or injection sanitizer. */
function scanSql(sql, options = {}) {
  if (typeof sql !== "string") throw new TypeError("Expected SQL to be a string.");
  const maxSqlLength = limit(options.maxSqlLength, 1_000_000, "maxSqlLength");
  const maxStatements = limit(options.maxStatements, 10_000, "maxStatements");
  if (sql.length > maxSqlLength) throw new RangeError("SQL exceeds maxSqlLength.");
  const statements = [];
  let start = 0;
  let pieces = [];
  let index = 0;
  function flush(end) {
    const canonical = pieces.join("").trim();
    if (canonical) {
      if (statements.length >= maxStatements) throw new RangeError("SQL exceeds maxStatements.");
      statements.push({ raw: sql.slice(start, end).trim(), canonical });
    }
    pieces = [];
    start = end + 1;
  }
  while (index < sql.length) {
    const char = sql[index];
    const next = sql[index + 1];
    if (char === "-" && next === "-") {
      index += 2;
      while (index < sql.length && sql[index] !== "\n" && sql[index] !== "\r") index += 1;
      pieces.push(" ");
      continue;
    }
    if (char === "/" && next === "*") {
      if (sql[index + 2] === "!" || sql.slice(index + 2, index + 4).toUpperCase() === "M!") {
        throw new TypeError("Executable SQL comments require separate database-specific review.");
      }
      let depth = 1;
      index += 2;
      while (index < sql.length && depth) {
        if (sql[index] === "/" && sql[index + 1] === "*") { depth += 1; index += 2; }
        else if (sql[index] === "*" && sql[index + 1] === "/") { depth -= 1; index += 2; }
        else index += 1;
      }
      if (depth) throw new TypeError("Unterminated SQL comment.");
      pieces.push(" ");
      continue;
    }
    if (char === "'" || char === '"' || char === "`" || char === "[") {
      const endQuote = char === "[" ? "]" : char;
      const quoteStart = index++;
      let closed = false;
      while (index < sql.length) {
        if (sql[index] === "\\" && char === "'") {
          throw new TypeError("Backslash-escaped strings require database-specific review; use standard doubled quotes.");
        }
        if (sql[index] === endQuote) {
          if (sql[index + 1] === endQuote) { index += 2; continue; }
          index += 1; closed = true; break;
        }
        index += 1;
      }
      if (!closed) throw new TypeError("Unterminated SQL quote.");
      pieces.push(char === "'" ? "''" : sql.slice(quoteStart, index));
      continue;
    }
    if (char === "$") {
      let end = index + 1;
      if (sql[end] !== "$" && /[A-Za-z_]/.test(sql[end] ?? "")) {
        while (end < sql.length && /[A-Za-z0-9_]/.test(sql[end])) end += 1;
      }
      if (sql[end] === "$") {
        const tag = sql.slice(index, end + 1);
        const closing = sql.indexOf(tag, end + 1);
        if (closing === -1) throw new TypeError("Unterminated dollar-quoted SQL string.");
        pieces.push("''"); index = closing + tag.length; continue;
      }
    }
    if (char === ";") { flush(index); index += 1; continue; }
    pieces.push(char);
    index += 1;
  }
  flush(sql.length);
  return statements;
}

function splitActions(value) {
  const parts = [];
  let start = 0;
  let depth = 0;
  let quote;
  for (let index = 0; index < value.length; index += 1) {
    const char = value[index];
    if (quote) {
      if (char === quote) {
        if (value[index + 1] === quote) index += 1;
        else quote = undefined;
      }
      continue;
    }
    if (char === '"' || char === "`" || char === "'") quote = char;
    else if (char === "[") quote = "]";
    else if (char === "(") depth += 1;
    else if (char === ")") depth -= 1;
    else if (char === "," && depth === 0) { parts.push(value.slice(start, index).trim()); start = index + 1; }
    if (depth < 0) throw new TypeError("Unbalanced SQL parentheses.");
  }
  if (depth || quote) throw new TypeError("Unbalanced SQL action.");
  parts.push(value.slice(start).trim());
  return parts;
}

module.exports = { scanSql, limit, splitActions };
