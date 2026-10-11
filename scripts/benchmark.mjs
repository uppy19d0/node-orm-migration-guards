import { performance } from 'node:perf_hooks';
import { parseSqlMigration } from 'migration-guard-core';

// Parser cost only: no database, pool, network or ORM query execution is measured.
for (const [name, sql, iterations] of [
  ['small migration', 'ALTER TABLE users ADD COLUMN status text, DROP COLUMN legacy;', 10_000],
  ['large comment', `DROP/*${'x'.repeat(200_000)}*/TABLE users;`, 100],
]) {
  for (let i = 0; i < 100; i += 1) parseSqlMigration(sql);
  const start = performance.now();
  for (let i = 0; i < iterations; i += 1) parseSqlMigration(sql);
  const elapsedMs = performance.now() - start;
  console.log(JSON.stringify({ name, characters: sql.length, iterations, elapsedMs: Number(elapsedMs.toFixed(2)), microsecondsPerParse: Number((elapsedMs * 1000 / iterations).toFixed(2)), node: process.version }));
}
