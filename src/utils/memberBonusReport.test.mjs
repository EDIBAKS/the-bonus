import { test } from 'node:test';
import assert from 'node:assert/strict';
import Decimal from 'decimal.js';
import { buildMemberBonusRows, filterMemberBonusRows, compareUnpaidMonths } from './memberBonusReport.mjs';

const convertCurrency = (amount, date) =>
  new Decimal(amount).mul(date < '2026-08-01' ? 10 : 20);

test('ranks members with unpaid bonuses and sums paid and unpaid by status and bonus date', () => {
  const bonuses = [
    { id: 1, DistributorIDNO: 'A', DistributorNames: 'Alice', RegisteredDPC: 'D1', Status: 'UnPaid', BonusDate: '2026-07-01', BonusValue: '2.5' },
    { id: 2, DistributorIDNO: 'A', DistributorNames: 'Alice', RegisteredDPC: 'D1', Status: 'Paid', BonusDate: '2026-09-01', BonusValue: '3' },
    { id: 3, DistributorIDNO: 'B', DistributorNames: 'Bob', RegisteredDPC: 'D1', Status: 'unpaid', BonusDate: '2026-09-01', BonusValue: '2' },
    { id: 4, DistributorIDNO: 'C', DistributorNames: 'Carol', RegisteredDPC: 'D1', Status: 'Paid', BonusDate: '2026-09-01', BonusValue: '4' },
    { id: 5, DistributorIDNO: 'A', DistributorNames: 'Alice', RegisteredDPC: 'D1', Status: 'Pending', BonusDate: '2026-09-01', BonusValue: '100' },
    { id: 6, DistributorIDNO: 'D', DistributorNames: 'Dan', RegisteredDPC: 'D2', Status: 'UnPaid', BonusDate: '2026-09-01', BonusValue: '5' },
  ];

  const rows = buildMemberBonusRows(bonuses, new Set(['D1']), false, convertCurrency);
  assert.deepEqual(rows.map(({ name, owed, paid }) => [name, owed.toString(), paid.toString()]), [
    ['Bob', '40', '0'],
    ['Alice', '25', '60'],
  ]);
  assert.deepEqual(buildMemberBonusRows(bonuses, new Set(['D1']), true, convertCurrency)
    .map((row) => row.name), ['Dan', 'Bob', 'Alice']);
});

test('retains zero-value unpaid records and does not merge missing member IDs', () => {
  const bonuses = [
    { id: 1, Status: 'UnPaid', BonusDate: '2026-09-01', BonusValue: 0 },
    { id: 2, Status: 'UnPaid', BonusDate: '2026-09-01', BonusValue: 1 },
  ];
  const rows = buildMemberBonusRows(bonuses, new Set(), true, convertCurrency);
  assert.deepEqual(rows.map((row) => [row.key, row.name, row.owed.toString()]), [
    ['missing:2', 'Unknown member', '20'],
    ['missing:1', 'Unknown member', '0'],
  ]);
  assert.deepEqual(buildMemberBonusRows(bonuses, new Set(), false, convertCurrency), []);
});

test('unpaid month badges are unique, sorted by year, and disappear when their bonuses are paid', () => {
  const bonuses = [
    { id: 1, DistributorIDNO: 'A', RegisteredDPC: 'D1', Status: 'UnPaid', BonusDate: '2026-01-03', BonusValue: 1 },
    { id: 2, DistributorIDNO: 'A', RegisteredDPC: 'D1', Status: 'UnPaid', BonusDate: '2025-12-01', BonusValue: 2 },
    { id: 3, DistributorIDNO: 'A', RegisteredDPC: 'D1', Status: 'UnPaid', BonusDate: '2026-01-25', BonusValue: 3 },
    { id: 4, DistributorIDNO: 'A', RegisteredDPC: 'D1', Status: 'Paid', BonusDate: '2026-02-01', BonusValue: 4 },
  ];
  const build = () => buildMemberBonusRows(bonuses, new Set(['D1']), false, convertCurrency);
  assert.deepEqual(build()[0].unpaidMonths, ['2025-12', '2026-01']);
  bonuses[0].Status = 'Paid';
  assert.deepEqual(build()[0].unpaidMonths, ['2025-12', '2026-01']);
  bonuses[2].Status = 'Paid';
  assert.deepEqual(build()[0].unpaidMonths, ['2025-12']);
  assert.equal(build()[0].paid.toString(), '80');
  bonuses[1].Status = 'Paid';
  assert.equal(build().length, 0);
});

test('filters member names case-insensitively without matching other columns', () => {
  const rows = [
    { name: 'Alice Smith', id: 'BOB' },
    { name: 'Bob Jones', id: 'ALICE' },
    { name: 'Unknown member', id: '' },
  ];
  assert.deepEqual(filterMemberBonusRows(rows, '  aLiCe  '), [rows[0]]);
  assert.deepEqual(filterMemberBonusRows(rows, 'jones'), [rows[1]]);
  assert.deepEqual(filterMemberBonusRows(rows, 'missing'), []);
  assert.deepEqual(filterMemberBonusRows(rows, '  '), rows);
  assert.deepEqual(filterMemberBonusRows(rows, null), rows);
});

test('sorts unpaid month lists chronologically, including multiple and missing months', () => {
  const months = [
    ['2026-01'],
    ['2025-12', '2026-02'],
    [],
    ['2025-12'],
  ];
  assert.deepEqual([...months].sort(compareUnpaidMonths), [
    [],
    ['2025-12'],
    ['2025-12', '2026-02'],
    ['2026-01'],
  ]);
  assert.deepEqual([...months].sort((left, right) => compareUnpaidMonths(right, left)), [
    ['2026-01'],
    ['2025-12', '2026-02'],
    ['2025-12'],
    [],
  ]);
});
