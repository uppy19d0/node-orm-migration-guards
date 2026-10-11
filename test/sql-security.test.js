import assert from 'node:assert/strict';
import test from 'node:test';
import { checkMigration, parseSqlMigration, splitSqlStatements } from 'migration-guard-core';

test('interleaved, nested and line comments cannot conceal destructive statements', () => {
  for (const sql of [
    'DROP/**/TABLE users;',
    'DROP/* outer /* nested */ tail */TABLE users;',
    'ALTER -- explanation\rTABLE users DROP/**/COLUMN email;',
  ]) assert.equal(checkMigration(sql).passed, false, sql);
});

test('all top-level ALTER actions are checked, including destructive actions after an addition', () => {
  const sql = "ALTER TABLE users ADD COLUMN price decimal(10,2), DROP COLUMN email";
  const result = checkMigration(sql);
  assert.deepEqual(result.operations.map(op => op.type), ['addColumn', 'dropColumn']);
  assert.equal(result.passed, false);
  assert.equal(result.operations[1].rawSql, sql);
});

test('literal text cannot create NOT NULL semantics or fake destructive statements', () => {
  const result = checkMigration("ALTER TABLE users ADD COLUMN note text DEFAULT 'NOT NULL; DROP TABLE users';");
  assert.equal(result.operations.length, 1);
  assert.equal(result.operations[0].nullable, true);
  assert.equal(result.passed, true);
});

test('dollar-quoted bodies and escaped identifier delimiters preserve statement boundaries', () => {
  assert.equal(splitSqlStatements('DO $body$ BEGIN DROP TABLE users; END $body$; SELECT 1;').length, 2);
  assert.equal(splitSqlStatements('SELECT "a"";b", `a``;b`, [a]];b]; DROP TABLE users;').length, 2);
});

test('strict review rejects unsupported SQL, dynamic bodies and unknown operation types', () => {
  for (const sql of ['DELETE FROM users', 'DO $$ BEGIN DROP TABLE users; END $$', 'CREATE FUNCTION f() RETURNS void AS $$ SELECT 1 $$ LANGUAGE SQL']) {
    const result = checkMigration(sql, { allowUnrecognized: false });
    assert.equal(result.passed, false);
    assert.equal(result.violations[0].ruleId, 'unrecognizedOperation');
  }
  assert.equal(checkMigration([{ type: 'custom' }], { allowUnrecognized: false }).passed, false);
  assert.equal(checkMigration('SELECT 1').passed, true); // Compatibility mode remains explicit.
});

test('malformed and executable-comment syntax is rejected before policy decisions', () => {
  for (const sql of ["SELECT 'unterminated", '/* unterminated', 'DO $$unterminated', '/*! DROP TABLE users */', '/*M! DROP TABLE users */', "SELECT 'back\\slash'"])
    assert.throws(() => checkMigration(sql), TypeError, sql);
});

test('SQL, statement and operation limits bound adversarial plans', () => {
  assert.throws(() => parseSqlMigration('SELECT 12345', { maxSqlLength: 5 }), RangeError);
  assert.throws(() => parseSqlMigration('SELECT 1; SELECT 2', { maxStatements: 1 }), RangeError);
  assert.throws(() => parseSqlMigration('DROP TABLE a,b,c', { maxOperations: 2 }), RangeError);
  assert.throws(() => checkMigration([{ type: 'x' }, { type: 'y' }], { maxOperations: 1 }), RangeError);
  assert.throws(() => parseSqlMigration('SELECT 1', { maxSqlLength: NaN }), TypeError);
});

test('structured operations require own type, targets and correctly typed metadata', () => {
  for (const input of [Object.create({ type: 'dropTable', table: 'users' }), { type: 'dropTable' }, { type: 'dropColumn', table: 42, column: 'email' }, { type: 'addColumn', table: 'users', column: 'x', nullable: 'false' }])
    assert.throws(() => checkMigration([input]), TypeError);
});

test('quoted whitespace and comma-bearing identifiers retain exact policy identity', () => {
  const sql = 'DROP TABLE "user  data", "audit,logs"';
  assert.deepEqual(parseSqlMigration(sql).map(op => op.table), ['user  data', 'audit,logs']);
  assert.equal(checkMigration('DROP TABLE "user  data"', { allowDropTable: ['user data'] }).passed, false);
  assert.equal(checkMigration('DROP TABLE "audit,logs"', { allowDropTable: true, blockedTables: ['audit,logs'] }).passed, false);
  assert.equal(checkMigration('DROP TABLE "user  data"', { allowDropTable: ['user  data'] }).passed, true);
});

test('escaped identifier delimiters are decoded for blocked-name matching', () => {
  assert.equal(checkMigration('DROP TABLE "user""data"', { allowDropTable: true, blockedTables: ['user"data'] }).passed, false);
  assert.equal(parseSqlMigration('DROP TABLE users$archive')[0].table, 'users$archive');
});

test('ambiguous quoted dot and edge-space identities are rejected', () => {
  for (const sql of ['DROP TABLE "a.b"', 'DROP TABLE " users "']) assert.throws(() => checkMigration(sql), TypeError);
});

test('allowlists and ignore lists cannot authorize differently cased quoted targets', () => {
  assert.equal(checkMigration('DROP TABLE "USERS"', { allowDropTable: ['users'] }).passed, false);
  assert.equal(checkMigration('DROP TABLE "USERS"', { ignoreTables: ['users'] }).passed, false);
  assert.equal(checkMigration('DROP TABLE "USERS"', { allowDropTable: ['USERS'] }).passed, true);
});
