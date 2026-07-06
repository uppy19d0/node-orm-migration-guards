# Contributing

Thanks for improving `node-orm-migration-guards`.

## Development Setup

```sh
npm install
npm test
npm run publish:check
npm pack --workspaces --dry-run
```

## Project Structure

```txt
packages/migration-guard-core      Shared parser and rule engine
packages/*-migration-guard         ORM-specific adapters
test/                              Node test runner coverage
docs/                              User and maintainer documentation
examples/                          Copyable integration examples
```

## Change Guidelines

- Keep runtime dependencies minimal.
- Do not add an ORM as a hard dependency in an adapter.
- Prefer shared rule behavior in `migration-guard-core`.
- Add adapter logic only for integration-specific behavior.
- Keep error messages actionable and safe for CI logs.
- Preserve both ESM and CommonJS entrypoints.

## Versioning

All packages share one version. Adapter dependencies on `migration-guard-core` must use the same exact version.

Before opening a PR:

```sh
npm run check:semver
npm test
```

Patch releases are for compatible fixes and documentation updates. Minor releases are for new options, new rules or new adapter APIs. Major releases are for breaking changes.

## Tests

Use the built-in Node.js test runner. Adapter tests should use small doubles instead of requiring the actual ORM package unless the behavior truly needs real integration coverage.

## Security

Do not open public issues for suspected vulnerabilities. See [SECURITY.md](SECURITY.md).

