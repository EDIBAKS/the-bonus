import { test } from 'node:test';
import assert from 'node:assert/strict';
import Decimal from 'decimal.js';
import { buildMemberBonusRows, filterMemberBonusRows, compareUnpaidMonths, memberBonusTotals, formatUnpaidMonths } from './memberBonusReport.mjs';
import { createMemberBonusPdf, createMemberBonusWorkbook } from './memberBonusExport.mjs';
import ExcelJS from 'exceljs';

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

test('grand totals follow the filtered rows and retain decimal precision', () => {
  const rows = [
    { name: 'Alice', owed: new Decimal('0.1'), paid: new Decimal('1.23') },
    { name: 'Alice Smith', owed: new Decimal('0.2'), paid: new Decimal('2.34') },
    { name: 'Bob', owed: new Decimal('50'), paid: new Decimal('60') },
  ];
  const totals = memberBonusTotals(filterMemberBonusRows(rows, 'alice'));
  assert.equal(totals.owed.toString(), '0.3');
  assert.equal(totals.paid.toString(), '3.57');
  assert.equal(memberBonusTotals([]).owed.toString(), '0');
  assert.equal(memberBonusTotals([]).paid.toString(), '0');
  assert.equal(formatUnpaidMonths(['2025-12', '2026-01']), '12/2025, 01/2026');
});

test('Excel export preserves supplied row order, text, numeric amounts and filtered totals', async () => {
  const rows = [
    { id: '001', name: '=Alice', unpaidMonths: ['2026-01', '2026-02'], owed: new Decimal('0.1'), paid: new Decimal('1.23') },
    { id: '002', name: 'Bob', unpaidMonths: ['2025-12'], owed: new Decimal('0.2'), paid: new Decimal('2.34') },
  ];
  const buffer = await createMemberBonusWorkbook(rows, {
    startDate: '2025-12-01', endDate: '2026-02-28', currency: 'USD', search: 'test',
  });
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);
  const sheet = workbook.getWorksheet('Unpaid Members');
  assert.equal(sheet.pageSetup.orientation, 'landscape');
  assert.equal(sheet.getCell('A6').value, '001');
  assert.equal(sheet.getCell('B6').value, '=Alice');
  assert.equal(sheet.getCell('C6').value, '01/2026, 02/2026');
  assert.equal(sheet.getCell('D6').value, 0.1);
  assert.equal(sheet.getCell('A7').value, '002');
  assert.equal(sheet.getCell('A8').value, 'Grand Total');
  assert.equal(sheet.getCell('D8').value, 0.3);
  assert.equal(sheet.getCell('E8').value, 3.57);
  assert.equal(sheet.getCell('D8').numFmt, '#,##0.00');
  assert.equal(sheet.getCell('A4').value, 'Member search: test');
});

test('PDF export is landscape and preserves order and totals across pages', () => {
  const rows = Array.from({ length: 100 }, (_, index) => ({
    id: String(100 - index), name: `Member ${index}`, unpaidMonths: ['2026-01'],
    owed: new Decimal('0.1'), paid: new Decimal('0.2'),
  }));
  const columns = ['Member ID', 'Member Name', 'Unpaid Months', 'Owed', 'Paid'].map((label) => ({ label }));
  const doc = createMemberBonusPdf(rows, {
    startDate: '2026-01-01', endDate: '2026-01-31', currency: 'USD', search: '',
  }, columns, (amount) => amount.toFixed(2));
  assert.ok(doc.internal.pageSize.getWidth() > doc.internal.pageSize.getHeight());
  assert.ok(doc.getNumberOfPages() > 1);
  assert.equal(doc.lastAutoTable.body[0].cells[0].text[0], '100');
  assert.equal(doc.lastAutoTable.body[99].cells[0].text[0], '1');
  assert.equal(doc.lastAutoTable.foot[0].cells[3].text[0], '10.00');
  assert.equal(doc.lastAutoTable.foot[0].cells[4].text[0], '20.00');
});
