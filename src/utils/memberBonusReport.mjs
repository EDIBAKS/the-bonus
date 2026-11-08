import Decimal from 'decimal.js';

export function filterMemberBonusRows(rows, search) {
  const query = (search || '').trim().toLocaleLowerCase();
  return query ? rows.filter((row) => row.name.toLocaleLowerCase().includes(query)) : rows;
}

export function compareUnpaidMonths(left, right) {
  return left.join(',').localeCompare(right.join(','));
}

export function memberBonusTotals(rows) {
  return rows.reduce((totals, row) => ({
    owed: totals.owed.plus(row.owed),
    paid: totals.paid.plus(row.paid),
  }), { owed: new Decimal(0), paid: new Decimal(0) });
}

export function formatUnpaidMonths(months) {
  return months.map((month) => `${month.slice(5, 7)}/${month.slice(0, 4)}`).join(', ');
}

export function buildMemberBonusRows(bonuses, allowedDpcCodes, allDpcs, convertCurrency) {
  const members = new Map();

  for (const bonus of bonuses) {
    const status = String(bonus.Status || '').trim().toLowerCase();
    if (status !== 'paid' && status !== 'unpaid') continue;
    if (!allDpcs && !allowedDpcCodes.has(bonus.RegisteredDPC)) continue;

    const memberKey = bonus.DistributorIDNO == null || bonus.DistributorIDNO === ''
      ? `missing:${bonus.id}`
      : `member:${bonus.DistributorIDNO}`;
    let member = members.get(memberKey);
    if (!member) {
      member = {
        key: memberKey,
        id: bonus.DistributorIDNO ?? '',
        name: bonus.DistributorNames || 'Unknown member',
        owed: new Decimal(0),
        paid: new Decimal(0),
        hasUnpaid: false,
        unpaidMonths: new Set(),
      };
      members.set(memberKey, member);
    }

    const amount = convertCurrency(bonus.BonusValue || 0, bonus.BonusDate);
    if (status === 'unpaid') {
      member.owed = member.owed.plus(amount);
      member.hasUnpaid = true;
      const month = String(bonus.BonusDate || '').slice(0, 7);
      if (/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) member.unpaidMonths.add(month);
    } else {
      member.paid = member.paid.plus(amount);
    }
  }

  return [...members.values()]
    .filter((member) => member.hasUnpaid)
    .map((member) => ({ ...member, unpaidMonths: [...member.unpaidMonths].sort() }))
    .sort((left, right) => right.owed.comparedTo(left.owed)
      || left.name.localeCompare(right.name)
      || String(left.id).localeCompare(String(right.id)));
}
