# Deploy to npm

This repository publishes eight workspace packages through `.github/workflows/publish.yml`. The workflow uses npm Trusted Publishing with GitHub OIDC; it does not use a persistent npm token.

## One-time npm setup

For each package in `packages/*/package.json`, open its npm package settings and add a GitHub Actions trusted publisher:

- Owner: `uppy19d0`
- Repository: `node-orm-migration-guards`
- Workflow filename: `publish.yml`
- Environment: `npm`
- Allowed action: direct `npm publish`

The workflow filename is just `publish.yml`, not its full path. Keep the GitHub `npm` environment configured for this job. Once all eight packages have a trusted publisher and one release succeeds, revoke the old `NPM_TOKEN` in npm and remove the repository secret.

The repository variable `NPM_TRUSTED_PUBLISHING_ENABLED` keeps release and publish jobs disabled until npm setup is complete. After all eight trusted publishers are configured, set this GitHub Actions variable to `true`. Then manually run `Create GitHub Release` on `main` to publish any version prepared while the gate was closed. Leave the variable unset or `false` until all eight mappings are ready.

## Release

1. Update the root and all workspace versions together. Keep internal dependencies pinned to that version.
2. Run `npm ci --ignore-scripts`, `npm audit --audit-level=high`, `npm test`, and `npm pack --workspaces --dry-run`.
3. Merge after CI succeeds. The `Create GitHub Release` workflow creates the version release; its successful completion triggers `Deploy to npm`. A manual run of `Deploy to npm` from `main` is also available.
4. The deploy workflow checks which exact package versions are unpublished, then publishes `migration-guard-core`, the adapters, and finally `node-orm-migration-guard`.
5. Verify that every new npm version shows a provenance attestation and that the eight versions match.

The publish script rejects local publishing without GitHub Actions OIDC. A failed publish should be corrected with a new version; never move a published Git tag.
