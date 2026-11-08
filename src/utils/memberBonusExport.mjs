import { jsPDF } from 'jspdf';
import { autoTable } from 'jspdf-autotable';
import { formatUnpaidMonths, memberBonusTotals } from './memberBonusReport.mjs';

export function createMemberBonusPdf(rows, details, columns, formatAmount) {
  const totals = memberBonusTotals(rows);
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  doc.setFontSize(14);
  doc.text('Members with Unpaid Bonuses', 14, 14);
  doc.setFontSize(10);
  doc.text(`Bonus dates: ${details.startDate} - ${details.endDate} | Currency: ${details.currency}`, 14, 21);
  const searchLines = doc.splitTextToSize(`Member search: ${details.search || 'All members'}`, 269);
  doc.text(searchLines, 14, 27);
  autoTable(doc, {
    head: [columns.map((column) => column.label)],
    body: rows.map((row) => [
      String(row.id), row.name, formatUnpaidMonths(row.unpaidMonths),
      formatAmount(row.owed), formatAmount(row.paid),
    ]),
    foot: [['Grand Total', '', '', formatAmount(totals.owed), formatAmount(totals.paid)]],
    showFoot: 'lastPage',
    startY: 30 + searchLines.length * 4,
    theme: 'grid',
    styles: { fontSize: 8, overflow: 'linebreak' },
    columnStyles: { 3: { halign: 'right' }, 4: { halign: 'right' } },
  });
  return doc;
}

export async function createMemberBonusWorkbook(rows, details) {
  const { default: ExcelJS } = await import('exceljs');
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Unpaid Members', {
    pageSetup: { orientation: 'landscape', fitToPage: true, fitToWidth: 1, fitToHeight: 0 },
  });
  sheet.addRow(['Members with Unpaid Bonuses']);
  sheet.addRow([`Bonus dates: ${details.startDate} - ${details.endDate}`]);
  sheet.addRow([`Currency: ${details.currency}`]);
  sheet.addRow([`Member search: ${details.search || 'All members'}`]);
  const header = sheet.addRow(['Member ID', 'Member Name', 'Unpaid Months (MM/YYYY)', 'Total Payment Owed', 'Total Paid']);
  header.font = { bold: true };
  for (const row of rows) {
    sheet.addRow([
      String(row.id),
      row.name,
      formatUnpaidMonths(row.unpaidMonths),
      row.owed.toDecimalPlaces(2).toNumber(),
      row.paid.toDecimalPlaces(2).toNumber(),
    ]);
  }
  const totals = memberBonusTotals(rows);
  const totalRow = sheet.addRow([
    'Grand Total', '', '', totals.owed.toDecimalPlaces(2).toNumber(), totals.paid.toDecimalPlaces(2).toNumber(),
  ]);
  totalRow.font = { bold: true };
  sheet.columns = [{ width: 20 }, { width: 30 }, { width: 40 }, { width: 22 }, { width: 20 }];
  sheet.getColumn(4).numFmt = '#,##0.00';
  sheet.getColumn(5).numFmt = '#,##0.00';
  return workbook.xlsx.writeBuffer();
}
