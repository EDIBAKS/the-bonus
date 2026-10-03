<script setup>
import { defineProps,computed } from "vue";
import { useCurrency } from "src/composables/useCurrency";
import Decimal from "decimal.js";
// Initialize the composable
const { convertCurrency } = useCurrency();
const props = defineProps({
  pivotData: Object,
  dpcNames: Array,
  payments: Array,
  dpcLabels: Object,
});
const displayPivotData = computed(() => {
  if (!props.payments) return props.pivotData || {};

  const totalsByDate = new Map();
  for (const payment of props.payments) {
    const paymentDate = String(payment.PaymentDate || '').slice(0, 10);
    const paidDpc = payment.PaidDPC || 'Unassigned';
    if (!paymentDate) continue;

    if (!totalsByDate.has(paymentDate)) totalsByDate.set(paymentDate, {});
    const dailyTotals = totalsByDate.get(paymentDate);
    dailyTotals[paidDpc] = (dailyTotals[paidDpc] || new Decimal(0)).plus(
      convertCurrency(payment.BonusValue || 0, payment.BonusDate)
    );
  }

  return Object.fromEntries([...totalsByDate.entries()].sort(([left], [right]) => right.localeCompare(left)));
});
const reportDpcNames = computed(() => props.dpcNames || []);
// Compute total for each DPC
const totalPerDpc = computed(() => {
  const totals = {};
  for (const dpc of reportDpcNames.value) {
    totals[dpc] = Object.values(displayPivotData.value).reduce((sum, values) => {
      return sum.plus(values[dpc] || 0);
    }, new Decimal(0));
  }
  return totals;
});
const grandTotal = computed(() => {
  return Object.values(totalPerDpc.value).reduce((sum, val) => sum.plus(val), new Decimal(0));
});
const formatAmount = (amount) => amount.toDecimalPlaces(2).toNumber().toLocaleString(undefined, {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
</script>

<template>
  <table class="styled-table">
    <thead>
      <tr>
        <th>Date</th>
        <th v-for="dpc in reportDpcNames" :key="dpc">{{ dpcLabels?.[dpc] || dpc }}</th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="(values, date) in displayPivotData" :key="date" :class="{'odd-row': Object.keys(displayPivotData).indexOf(date) % 2 === 0}">
        <td>{{ date }}</td>
        <td v-for="dpc in reportDpcNames" :key="dpc">
          {{ formatAmount(props.payments ? (values[dpc] || new Decimal(0)) : convertCurrency(values[dpc] || 0)) }}
        </td>
      </tr>
         <!-- Total Row -->
         <tr class="total-row">
        <td><strong>Total</strong></td>
        <td v-for="dpc in reportDpcNames" :key="dpc">
          <strong>{{ formatAmount(props.payments ? totalPerDpc[dpc] : convertCurrency(totalPerDpc[dpc] || 0)) }}</strong>
        </td>
      </tr>
      <tr class="total-row">
  <td colspan="100%">
    <div class="text-right q-pa-sm grand-total-text">
      Grand Total: <strong>{{ formatAmount(convertCurrency(grandTotal)) }}</strong>
    </div>
  </td>
</tr>
    </tbody>
  </table>
</template>

<style scoped>
.styled-table {
  width: 100%;
  border-collapse: collapse;
  margin: 20px 0;
}

.styled-table th, .styled-table td {
  padding: 12px 15px;
  text-align: left;
  border-bottom: 1px solid #ddd; /* Reduced border */
}

.styled-table th {
  background-color: #f4f4f4;
  color: #333;
}

.styled-table td {
  background-color: #fff;
  transition: background-color 0.3s ease; /* Smooth hover effect */
}

.styled-table tr:hover td {
  background-color: #f1f1f1; /* Hover effect */
}

.odd-row {
  background-color: #f9f9f9; /* Inverted color for odd rows */
}

.styled-table th, .styled-table td {
  font-size: 14px;
}

.styled-table tbody tr:hover td {
  background-color: #e9e9e9; /* Lighter hover effect */
}
.total-row {
  font-weight: bold;
  background-color: #f4f4f4;
  color: #333;
}
.grand-total-text {
  color: #1976D2; /* Quasar primary blue */
  font-size: 1.25rem; /* adjust as needed */
 
}
</style>
