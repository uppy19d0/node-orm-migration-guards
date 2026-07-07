# Troubleshooting

## The package is not visible on npm

Check the exact package name. The workspace root `node-orm-migration-guards` is private and is not published to npm. The recommended unified package is:

- `node-orm-migration-guard`

The lower-level packages are:

- `migration-guard-core`
- `typeorm-migration-guard`
- `prisma-migration-guard`
- `sequelize-migration-guard`
- `knex-migration-guard`
- `drizzle-migration-guard`
- `mikro-orm-migration-guard`

## GitHub Actions says `NPM_TOKEN` is missing

Create an npm automation token and store it as a repository secret named `NPM_TOKEN`.

If the workflow uses an environment named `npm`, confirm that the secret is available to that environment.

## npm returns `E401 Unauthorized`

The npm token is invalid, expired, revoked or missing publish permission.

Create a new token in npm, update `NPM_TOKEN`, and rerun the workflow.

## The publish workflow did not run after release creation

Releases created by GitHub Actions with `GITHUB_TOKEN` do not trigger a second workflow through the `release` event. This repository also listens for the `Create GitHub Release` workflow completion, which handles that case.

## A migration was blocked but it is intentional

Prefer a narrow allow list:

```js
assertSafeMigration(sql, {
  allowDropColumn: ["users.legacy_email"]
});
```

Avoid disabling a full rule unless your team has a separate review process for that class of change.

## SQL is not detected

The parser focuses on common migration statements. If your ORM generates database-specific SQL that is not parsed, pass structured migration operations directly to `migration-guard-core` or open an issue with a minimal SQL example.
