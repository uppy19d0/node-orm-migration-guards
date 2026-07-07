# Changelog

All notable changes to this project are documented here.

This project follows Semantic Versioning. The workspace root and all published packages share the same version.

## Unreleased

- Added `node-orm-migration-guard`, a unified package configured with `orm` and `database`.

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
