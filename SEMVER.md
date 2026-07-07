# Semantic Versioning Policy

`node-orm-migration-guards` follows Semantic Versioning after `1.0.0`.

All packages in this suite currently share the same version. Adapter packages depend on `migration-guard-core` with the same exact version. The unified `node-orm-migration-guard` package depends on the core and adapter packages with that same exact version.

## Public API

The public API is everything a package consumer can import, call, configure, or rely on at runtime:

- package entrypoints and `exports`
- TypeScript declarations in `src/index.d.ts`
- exported functions, classes and constants
- documented options
- default rule behavior
- supported module formats
- supported Node.js engine range

## Patch Releases

Patch versions are for backwards-compatible changes only:

- documentation improvements
- CI or release maintenance
- bug fixes that preserve the public API
- parser fixes that do not remove existing documented behavior
- internal refactors with no consumer-visible API change

## Minor Releases

Minor versions are for backwards-compatible additions:

- new exported helpers
- new guard options
- new rule identifiers
- new TypeScript types
- new ORM integration helpers
- new documented behavior that does not break existing consumers

## Major Releases

Major versions are required for breaking changes:

- removing or renaming an export
- changing an existing function signature incompatibly
- changing default rule severity incompatibly
- weakening default safety checks
- dropping a supported Node.js major version
- removing CommonJS or ESM support

## CI Guard

The CI workflow runs `scripts/check-semver.js`.

The guard checks the current commit against the previous commit or pull request base:

- all workspace package versions must match the root version
- adapter dependencies on `migration-guard-core` must match the core version
- unified-package dependencies on the core and adapters must match the workspace version
- package-content changes must include a version increase for that package
- public API changes are not allowed in patch releases
- public API changes require at least a minor version bump

This guard is intentionally conservative. It cannot prove every behavioral change is safe, but it blocks the most common accidental SemVer mistakes.
