# Supply-chain controls

Review date: 2026-10-12.

Runtime: migration-plan/SQL analysis and policy checks, with local migration-file reading in Prisma/Drizzle adapters. This is not a firewall for live ORM queries and cannot guarantee SQL-injection protection. Applications retain responsibility for parameterized queries, database credentials, authorization and explicit migration execution.

## Release boundary

- Explicit package file allowlists and registry metadata identify the artifact.
- `scripts/check-package-contents.mjs` inspects npm's dry-run file list with lifecycle scripts disabled. Six regression cases cover private files, path traversal, install hooks, credential-like text, documentation and file-size bounds.
- CI and publishing workflows invoke the same guard after the package build/prepare step.
- Publishing requests verified provenance through the repository's GitHub Actions OIDC identity; a workflow alone does not configure npm's trusted publisher.
- Dependencies are locked, audited and updated through reviewed Dependabot PRs. Pinned Actions remain subject to review.

## Verification limits

The guard catches selected packaging mistakes; it does not establish complete secret detection, runtime safety or absence of unknown vulnerabilities. Validated package contents do not replace code review, dependency review or scanning. Legitimate filesystem/process capabilities remain visible and documented. Socket's package score includes adoption and dependency metrics in addition to alerts; no 100% score is promised. Inspect the exact published version after each release.

Consumer guidance and source/license attribution are included in each package README. See SECURITY.md for reporting and SECURITY_REVIEW.md for prior assessment scope.
