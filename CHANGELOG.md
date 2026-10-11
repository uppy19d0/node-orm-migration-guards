# Changelog

## 0.4.0

- Add bounded SQL lexing, nested-comment handling and dollar-quoted statement boundaries.
- Inspect all top-level ALTER TABLE actions and reject malformed or executable-comment syntax.
- Add explicit strict review through allowUnrecognized: false and validate structured operations.
- Add resource limits, security regression tests and a reproducible local parser benchmark.
- Compatibility: malformed SQL and incorrectly typed operations now throw; review unsupported syntax before upgrading.


All notable changes to this project are documented here.

This project follows Semantic Versioning. The workspace root and all published packages share the same version.

## 0.2.0

- Added `node-orm-migration-guard`, a unified package configured with `orm` and `database`.
- Added adapter subpath exports such as `node-orm-migration-guard/drizzle` and `node-orm-migration-guard/prisma`.
- Removed ORM peer dependency declarations because the guards use duck-typed ORM objects and do not import ORM packages at runtime.

## 0.1.1

Documentation and release polish.

- Expanded package READMEs for npm.
- Added professional integration documentation.
- Added CI, adapter and troubleshooting guides.
- Added contribution guidance and issue templates.
- Clarified local versus GitHub Actions npm publishing.

## 0.1.0

Initial public release.

- Added `migration-guard-core`.
- Added adapters for TypeORM, Prisma Migrate, Sequelize, Knex, Drizzle and MikroORM.
- Added SQL parsing for common destructive migration statements.
- Added default rules for table drops, column drops, truncates, renames and risky `NOT NULL` additions.
- Added GitHub Actions CI, release and npm publish workflows.
