# Deploy to npm

This repository publishes all `node-orm-migration-guards` workspace packages to npm through GitHub Actions.

## Packages

The publish order is:

1. `migration-guard-core`
2. `drizzle-migration-guard`
3. `knex-migration-guard`
4. `mikro-orm-migration-guard`
5. `prisma-migration-guard`
6. `sequelize-migration-guard`
7. `typeorm-migration-guard`
8. `node-orm-migration-guard`

The core package is published first because every adapter depends on it. The unified `node-orm-migration-guard` package is published last because it depends on the adapters.

## One-Time Setup

1. Revoke any npm token that was shared outside npm or GitHub Secrets.
2. Create a new npm automation token from npmjs.com.
3. In GitHub, open `Settings` > `Secrets and variables` > `Actions`.
4. Add a repository secret named `NPM_TOKEN`.
5. Paste the new npm token as the secret value.
6. Optional but recommended: create an environment named `npm`.

## Automatic Deploy

Creating a GitHub release starts the deploy workflow.

The publish workflow also runs after the `Create GitHub Release` workflow completes successfully on `main`. This avoids relying only on the `release` event, because releases created by GitHub Actions with `GITHUB_TOKEN` do not trigger another workflow run.

The workflow checks every workspace package against npm before publishing:

- If `package@version` already exists on npm, that package is skipped.
- If `package@version` does not exist on npm, that package is published.
- Packages are published in dependency-safe order.

## Manual Deploy

1. Open the repository on GitHub.
2. Go to `Actions`.
3. Open `Deploy to npm`.
4. Click `Run workflow`.
5. Select branch `main`.
6. Click `Run workflow`.

The workflow will:

1. check out the code
2. set up Node.js
3. show workspace package metadata
4. check SemVer policy
5. check npm for existing package versions
6. install dependencies with `npm ci`
7. run tests
8. verify the npm token
9. preview package contents
10. publish unpublished packages to npm with provenance
11. verify published versions

## Local Deploy

Local publish requires an npm session:

```sh
npm login
npm run publish:check
npm run publish:npm
```

The local script intentionally publishes with `--provenance=false`. Provenance is enabled only inside GitHub Actions, where npm can use GitHub's OIDC identity.

## Release Deploy

1. Update `version` in the root `package.json` and every workspace `package.json`.
2. Keep adapter dependencies on `migration-guard-core` aligned with the core version.
3. Keep `node-orm-migration-guard` dependencies on the core and adapter packages aligned with the workspace version.
4. Commit and push the change.
5. Create a Git tag, for example `v0.1.1`.
6. Push the tag.
7. Create a GitHub Release from that tag.

## Important

Never commit npm tokens to this repository. The workflow reads the token only from the GitHub secret named `NPM_TOKEN`.
