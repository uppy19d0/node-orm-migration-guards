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

## npm says the trusted publisher is not configured

Configure a GitHub Actions trusted publisher for **each** of the eight npm packages. Use owner `uppy19d0`, repository `node-orm-migration-guards`, workflow filename `publish.yml`, and environment `npm`. Allow direct `npm publish`. See [DEPLOY.md](../DEPLOY.md).

## npm returns `E401 Unauthorized`

Check the trusted publisher fields, that the workflow runs on a GitHub-hosted runner, and that `id-token: write` is present. The workflow deliberately does not use an npm token. If a version was already published, increment the version before retrying.

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
