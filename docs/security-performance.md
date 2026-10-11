# Migration security and performance assessment

## Scope and recommendation

Keep migration-policy improvements in this suite. Build a separate runtime query-policy package only when there is a concrete integration and measurable need. Migration analysis happens during deployment; query authorization happens on every request and must know the authenticated user, tenant and ORM semantics. Combining both would create misleading security promises and an unnecessarily broad dependency surface.

This suite does not prevent all SQL injection, enforce tenant isolation, detect every malicious migration, inspect database privileges or improve query plans. Use parameterized values, allowlisted dynamic identifiers, least-privilege database roles and application authorization. A syntactically safe query can still disclose another tenant's data. Do not execute user-supplied migration text or let requests override guard options.

## Changes in 0.4.0

| Risk | Implemented control | Remaining limitation |
| --- | --- | --- |
| Destructive SQL hidden behind comments | Lex comments before recognition, including nested block comments | Database-specific SQL grammar is not fully parsed |
| Destructive second ALTER action | Check each top-level comma-separated action; retain original SQL evidence | Unsupported actions need strict review |
| Dynamic or unknown SQL silently accepted | `allowUnrecognized: false` reports `unrecognizedOperation` as an error | Default compatibility mode still allows unknown SQL; explicitly opt in |
| Quote/comment confusion | Keep standard doubled quotes, bracket identifiers and dollar-quoted bodies intact; reject malformed input | Backslash strings and executable comments require separate review |
| Excessive analysis input | Character, statement and operation limits with validation | Limits bound this analyzer, not the database's execution time |
| Misleading structured plans | Require own operation types, named targets and typed flags | Structured plans must match the SQL that actually executes |

Strict mode also rejects legitimate SELECT, CREATE, DML, procedures and other unsupported statements. It is a conservative review policy, not a complete SQL validator. Do not disable the rule globally merely to get an unfamiliar migration through CI. Have an authorized reviewer use a separate reviewed execution path. Existing `ignoredRules`, severity overrides and broad allowlists are trusted escape hatches; they are not safe to expose to clients.

Malformed SQL and wrongly typed structured operations now throw. Catching and ignoring those exceptions defeats the guard. Adapter wrappers cover only their documented migration methods; direct access to the original ORM/connection remains a bypass. No adapter claims transparent protection of every runtime query.

## Performance process

Run `npm run benchmark` on the deployment runtime and retain the JSON output alongside the commit and workload. It measures local parsing only. The lexer scans bounded input without executing SQL, downloading data or compiling attacker-supplied regular expressions. Existing child-process deadline tests can terminate synchronous parsing regressions. New cases cover mixed ALTER actions, literals, nested comments, malformed inputs and configured limits.

For runtime performance, measure p95/p99 query latency, connection-pool waits, rows read, query counts and database execution plans. Address N+1 queries, bounded pagination, appropriate indexes and transaction duration in the application. Those improvements cannot be inferred from this parser benchmark. Database timeouts must be configured through the database or ORM; an application Promise timeout does not necessarily cancel a running query.

## Proposed separate runtime package

A future package should provide explicit per-ORM adapters for allowlisted filters/sorts, bounded pagination, query timeouts with documented cancellation, and tenant authorization callbacks. It should never rewrite arbitrary SQL or claim to sanitize string concatenation. Start with one application's concrete query path, adversarial tests and measured overhead before adding other adapters. No such runtime package is included in this release.

## Primary references

- [OWASP SQL Injection Prevention](https://cheatsheetseries.owasp.org/cheatsheets/SQL_Injection_Prevention_Cheat_Sheet.html).
- [OWASP Database Security](https://cheatsheetseries.owasp.org/cheatsheets/Database_Security_Cheat_Sheet.html).
- [PostgreSQL lexical structure](https://www.postgresql.org/docs/current/sql-syntax-lexical.html).
