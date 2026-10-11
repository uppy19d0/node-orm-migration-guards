import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { normalizeIdentifier, parseSqlMigration } from 'migration-guard-core';

test('identifier cleanup preserves embedded commas and strips only trailing commas', () => {
  assert.equal(normalizeIdentifier('  "public"."users",,,  '), 'public.users');
  assert.equal(normalizeIdentifier('users,,,suffix'), 'users,,,suffix');
  assert.equal(normalizeIdentifier(','.repeat(100000)), '');
});

test('normalized whitespace preserves DROP and TRUNCATE option semantics', () => {
  for (const [sql, type, tables] of [
    ['DrOp\tTaBlE\nIF\tEXISTS users, audit CASCADE', 'dropTable', ['users', 'audit']],
    ['DROP TABLE users RESTRICT', 'dropTable', ['users']],
    ['TRUNCATE\tTABLE audit\nRESTART\tIDENTITY CASCADE', 'truncateTable', ['audit']],
    ['TRUNCATE audit CONTINUE IDENTITY', 'truncateTable', ['audit']],
  ]) {
    const operations = parseSqlMigration(sql);
    assert.deepEqual(operations.map(operation => operation.type), tables.map(() => type));
    assert.deepEqual(operations.map(operation => operation.table), tables);
    assert.equal(operations[0].rawSql, sql);
  }
});

test('adversarial comma and whitespace inputs finish in an isolated process', () => {
  // A child deadline can actually stop a synchronous ReDoS; a Promise timeout cannot.
  const program = `
    import assert from 'node:assert/strict';
    import { normalizeIdentifier, parseSqlMigration } from 'migration-guard-core';
    const commas = 'users' + ','.repeat(200000) + 'suffix';
    assert.equal(normalizeIdentifier(commas), commas);
    const spaces = ' '.repeat(200000);
    for (const sql of [
      'DROP TABLE' + spaces + 'users' + spaces + 'CASCADE',
      'TRUNCATE' + spaces + 'TABLE audit' + spaces + 'RESTART IDENTITY',
      'TRUNCATE audit' + spaces + 'CONTINUE IDENTITY',
      'DROP TABLE' + spaces,
      'TRUNCATE' + spaces,
      'DROP TABLE users' + spaces + 'not_an_option',
    ]) assert.ok(Array.isArray(parseSqlMigration(sql)));
    console.log('ok');
  `;
  const child = spawnSync(process.execPath, ['--input-type=module', '--eval', program], {
    cwd: fileURLToPath(new URL('../', import.meta.url)),
    timeout: 10000,
    encoding: 'utf8',
  });
  assert.ifError(child.error);
  assert.equal(child.status, 0, child.stderr);
  assert.equal(child.stdout.trim(), 'ok');
});
