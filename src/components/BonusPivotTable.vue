<script setup>
import { defineProps,computed } from "vue";
import { useCurrency } from "src/composables/useCurrency";
// Initialize the composable
const { currencyType, convertCurrency } = useCurrency();
const props = defineProps({
  pivotData: Object,
  dpcNames: Array
});
// Compute total for each DPC
const totalPerDpc = computed(() => {
  const totals = {};
  for (const dpc of props.dpcNames) {
    totals[dpc] = Object.values(props.pivotData).reduce((sum, values) => {
      return sum + (values[dpc] || 0);
    }, 0);
  }
  return totals;
});
const grandTotal = computed(() => {
  return Object.values(totalPerDpc.value).reduce((sum, val) => sum + val, 0);
});
</script>

<template>
   
    <q-col cols="4" class="q-gutter-sm">
    <q-radio v-model="currencyType" label="USD" val="USD" color="primary" />
    <q-radio v-model="currencyType" label="Local Currency" val="LC" color="primary" />
  </q-col>
 
  <table class="styled-table">
    <thead>
      <tr>
        <th>Date</th>
        <th v-for="dpc in dpcNames" :key="dpc">{{ dpc }}</th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="(values, date) in pivotData" :key="date" :class="{'odd-row': Object.keys(pivotData).indexOf(date) % 2 === 0}">
        <td>{{ date }}</td>
        <td v-for="dpc in dpcNames" :key="dpc">
            {{ convertCurrency(values[dpc] || 0).toLocaleString() }}
        </td>
      </tr>
         <!-- Total Row -->
         <tr class="total-row">
        <td><strong>Total</strong></td>
        <td v-for="dpc in dpcNames" :key="dpc">
          <strong>{{ convertCurrency(totalPerDpc[dpc] || 0).toLocaleString() }}</strong>
        </td>
      </tr>
      <tr class="total-row">
  <td colspan="100%">
    <div class="text-right q-pa-sm grand-total-text">
      Grand Total: <strong>{{ convertCurrency(grandTotal).toLocaleString() }}</strong>
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
