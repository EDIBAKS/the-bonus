<template>
  <q-page class="q-pa-md">
    <q-card class="q-pa-md" flat>
      <div class="q-pa-md">
        <template v-if="reportType !== 'distributors'">
          <q-input v-model="startDate" label="Start Date" type="date" filled dense class="q-mb-md" />
          <q-input v-model="endDate" label="End Date" type="date" filled dense class="q-mb-md" />
        </template>

        <q-select
          v-model="reportType"
          :options="reportOptions"
          label="Report Type"
          filled
          dense
          class="q-mb-md"
          emit-value
          map-options
        />

        <q-btn v-if="reportType !== 'distributors'" label="Filter" color="primary" @click="fetchData" class="q-mt-md full-width" />
      </div>

      <q-card class="q-mt-md">
     
        <q-item-label header class="row items-center justify-between">
          <div>
            <span class="text-lg text-bold">{{ baseTitle }}</span> 
            <span v-if="startDate && endDate"> ({{ startDate }} - {{ endDate }})</span>
          </div>
        </q-item-label>

        <template v-if="reportType === 'daily'">
          
          <div v-if="dailyPaidPayments.length > 0">
            <div class="">Bonus Report</div>
            <q-col cols="6" class="q-gutter-sm flex justify-end items-center">
  <q-btn flat dense round icon="print" @click="printReport" color="primary">
    <q-tooltip>Print Report</q-tooltip>
  </q-btn>

  <q-btn flat dense round icon="picture_as_pdf" @click="exportToPDF" color="red">
    <q-tooltip>Export to PDF</q-tooltip>
  </q-btn>
</q-col>

            <BonusPivotTable
              :payments="scopedDailyPaidPayments"
              :dpc-names="dailyDpcCodes"
              :dpc-labels="dailyDpcLabels"
            />
          <!-- Total Row -->
    <!-- Total Row -->
       <!-- Grand Total -->
    
    
  </div>
      <div v-else>
            <p>No data available for the selected date range.</p>
          </div>
        </template>
        <template v-if="reportType === 'user-daily'">
          <div class="row items-center justify-between q-pa-md">
            <span class="text-caption text-grey-7">Amounts: {{ currencyType === 'LC' ? 'Local Currency' : 'USD' }}</span>
            <q-spinner v-if="userDailyLoading" color="primary" size="sm" />
          </div>
          <div class="text-caption text-grey-7 q-px-md q-pb-sm">
            Grouped by the DPC captured when paid and the PaidBy value recorded on the payment.
          </div>
          <q-table
            flat
            bordered
            dense
            row-key="paymentDate"
            :rows="userDailyRows"
            :columns="userDailyColumns"
            :rows-per-page-options="[0]"
            :pagination="{ sortBy: 'paymentDate', descending: true, rowsPerPage: 0 }"
          >
            <template v-slot:no-data>
              <div class="full-width row flex-center text-grey q-pa-md">
                No paid payments found for the selected date range.
              </div>
            </template>
            <template v-slot:bottom-row>
              <q-tr class="bg-grey-2 text-weight-bold">
                <q-td>Grand Total</q-td>
                <q-td
                  v-for="column in userDailyColumns.slice(1, -1)"
                  :key="column.name"
                  class="text-right"
                >
                  {{ formatUserDailyAmount(userDailyTotals[column.field]) }}
                </q-td>
                <q-td class="text-right">
                  {{ formatUserDailyAmount(userDailyTotals.totalPay) }}
                </q-td>
              </q-tr>
            </template>
          </q-table>
        </template>
        <template v-if="reportType === 'summary'">
          <q-row class="items-center justify-between q-mb-md">
    <q-col cols="12">
  <departmenttype />
  <div class="text-caption text-grey-7">
    Amounts: {{ currencyType === 'LC' ? 'Local Currency' : 'USD' }}
  </div>
</q-col>


    <!-- Right: Print & Export Buttons -->
    <q-col cols="6" class="q-gutter-sm text-right">
      <q-btn flat dense round icon="print" @click="printReport" color="primary">
        <q-tooltip>Print Report</q-tooltip>
      </q-btn>
      
      <q-btn flat dense round icon="picture_as_pdf" @click="exportToPDF" color="red">
        <q-tooltip>Export to PDF</q-tooltip>
      </q-btn>
    </q-col>
  </q-row>
  <table class="q-mt-md styled-table">
    <thead>
      <tr>
        <th>DPC Name</th>
        <th>Total Paid Bonus</th>
        <th>Total Unpaid Bonus</th>
        <th>Total Bonus</th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="(bonus, index) in summaryRows" :key="index" :class="{'hover-row': true, 'inverted-row': index % 2 === 0}">
        <td>{{ bonus.dpc_name }}</td>
        <td>{{ formatSummaryCurrency(bonus.totalpaidbonus) }}</td>
        <td>{{ formatSummaryCurrency(bonus.totalunpaidbonus) }}</td>
        <td>{{ formatSummaryCurrency(bonus.totalbonus) }}</td>
      </tr>
     <tr>
      <td><strong>Total</strong></td>
      <td><strong>{{ formatSummaryCurrency(totalPaidBonus) }}</strong></td>
      <td><strong>{{ formatSummaryCurrency(totalUnpaidBonus) }}</strong></td>
      <td><strong>{{ formatSummaryCurrency(totalBonus) }}</strong></td>
     </tr>
     
    </tbody>
  </table>
        </template>
        <template v-if="reportType === 'yearly'">
          <div class="row items-center justify-between q-pa-md">
            <departmenttype />
            <span class="text-caption text-grey-7">Amounts: {{ currencyType === 'LC' ? 'Local Currency' : 'USD' }}</span>
            <q-spinner v-if="yearlyBonusLoading" color="primary" size="sm" />
          </div>
          <div class="q-px-md q-pb-md">
            <div class="row items-center q-gutter-lg q-mb-md text-caption">
              <span><i class="yearly-legend paid" /> Paid</span>
              <span><i class="yearly-legend unpaid" /> Unpaid</span>
            </div>
            <div v-if="yearlyBonusRows.length" class="yearly-chart">
              <div v-for="row in yearlyBonusRows" :key="row.year" class="yearly-chart-row">
                <strong class="yearly-chart-year">{{ row.year }}</strong>
                <div class="yearly-chart-track" :aria-label="`${row.year}: ${formatYearlyCurrency(row.totalPaid)} paid, ${formatYearlyCurrency(row.totalUnpaid)} unpaid`">
                  <span class="yearly-chart-paid" :style="{ width: `${yearlySegmentWidth(row.totalPaid)}%` }" />
                  <span class="yearly-chart-unpaid" :style="{ width: `${yearlySegmentWidth(row.totalUnpaid)}%` }" />
                </div>
                <span class="yearly-chart-total">{{ formatYearlyCurrency(row.total) }}</span>
              </div>
            </div>
            <div v-else-if="!yearlyBonusLoading" class="text-grey-7 q-py-lg text-center">
              No bonuses found in the selected scope.
            </div>
            <q-markup-table v-if="yearlyBonusRows.length" flat bordered dense class="q-mt-md">
              <thead>
                <tr>
                  <th class="text-left">Bonus Year</th>
                  <th class="text-right">Paid</th>
                  <th class="text-right">Unpaid</th>
                  <th class="text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="row in yearlyBonusRows" :key="row.year">
                  <td>{{ row.year }}</td>
                  <td class="text-right">{{ formatYearlyCurrency(row.totalPaid) }}</td>
                  <td class="text-right">{{ formatYearlyCurrency(row.totalUnpaid) }}</td>
                  <td class="text-right text-weight-bold">{{ formatYearlyCurrency(row.total) }}</td>
                </tr>
                <tr class="text-weight-bold">
                  <td>All Years</td>
                  <td class="text-right">{{ formatYearlyCurrency(yearlyBonusTotals.totalPaid) }}</td>
                  <td class="text-right">{{ formatYearlyCurrency(yearlyBonusTotals.totalUnpaid) }}</td>
                  <td class="text-right">{{ formatYearlyCurrency(yearlyBonusTotals.total) }}</td>
                </tr>
              </tbody>
            </q-markup-table>
          </div>
        </template>
        <template v-if="reportType === 'distributors'">
  <div>
    <div class="row items-center">
      <departmenttype />
      <div v-if="bonusStore.loading" class="q-ml-sm">
        <div class="row">
          <img src="../assets/orange_circles.gif" alt="Loading" width="22" height="22" />
          <span class="q-ml-xs text-orange">Fetching data...</span>
        </div>
      </div>
    </div>

    <!-- DPC Selection -->
    <q-select
      v-model="bonusStore.selectedDPC"
      :options="bonusStore.Dpcs"
      label="Select DPC"
      option-value="dpccode"
      option-label="dpcname"
      filled
      dense
      emit-value
      map-options
      @update:model-value="onDPCChange"
      :clearable="true"
      class="q-mb-md" 
    />

    <!-- Distributor ID Input -->
    <q-input v-model="DistributorIDNO" label="Distributor ID" filled dense class="q-mb-md"  />

    <!-- Search Input -->
    <input
      v-model="searchQuery"
      type="text"
      placeholder="Search by name"
      class="search-input"
      @input="onSearchQueryChange"
     
    />

    <!-- Dynamic List of Search Results -->
    <ul v-if="bonusStore.distributors.length && searchQuery.trim() !== ''" class="q-mb-md" >
      <li
        v-for="distributor in bonusStore.distributors"
        :key="distributor.DistributorIDNO"
        @click="selectDistributor(distributor)"
        class="distributor-option"
      >
        {{ distributor.DistributorNames }}
      </li>
    </ul>

    <!-- Table shows only the selected user -->
    <q-table
      :rows="bonusStore.selectedDistributor.length ? bonusStore.selectedDistributor : bonusStore.dpcDistributors"
      :columns="columns"
      row-key="DistributorIDNO"
      dense
      bordered
    >
      <template v-slot:body="props">
        <q-tr :props="props">
          <q-td key="DistributorIDNO">{{ props.row.DistributorIDNO }}</q-td>
          <q-td key="DistributorNames">{{ props.row.DistributorNames }}</q-td>
          
          <q-td key="DistributorPosition">{{ props.row.DistributorPosition }}</q-td>
          <q-td key="DistributorNames">{{ props.row.DistributorTelephone1 }}</q-td>
          <!-- DPC Selection -->
          <q-td key="RegisteredDPC">
            <q-select
              v-model="props.row.RegisteredDPC"
              :options="bonusStore.Dpcs"
              option-value="dpccode"
              option-label="dpcname"
              dense
              emit-value
              map-options
            />
          </q-td>

          <!-- Save Button with Confirmation -->
          <q-td key="actions">
            <q-btn
              icon="save"
              color="primary"
              dense
              flat
               @click="confirmUpdate(props.row)"
            />
          </q-td>
          
        </q-tr>
      </template>
    </q-table>
  </div>
</template>

      </q-card>
    </q-card>
  </q-page>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch, watchEffect } from 'vue';
import { useBonusStore } from 'src/stores/bonusStore';
import { useStoreAuth } from 'src/stores/storeAuth';
import { supabase } from 'src/boot/supabase';
import { addDays, format, eachDayOfInterval, parseISO } from 'date-fns';
import BonusPivotTable from 'src/components/BonusPivotTable.vue';
import { useCurrency } from 'src/composables/useCurrency';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import Decimal from 'decimal.js';
import departmenttype from '../components/DepartmentTypeSelector.vue'
import { useQuasar } from "quasar";
const startDate = ref('');
const endDate = ref('');
const reportType = ref('daily');
const dailyPaidPayments = ref([]);
const dailyPaidLoading = ref(false);
const userDailyPayments = ref([]);
const userDailyLoading = ref(false);
const summaryPayments = ref([]);
const summaryLoading = ref(false);
const yearlyBonusPayments = ref([]);
const yearlyBonusLoading = ref(false);
let yearlyBonusSubscription = null;
let yearlyBonusRefreshTimeout = null;
const bonusStore = useBonusStore();
const storeAuth = useStoreAuth(); // Get user info
const { currencyType, convertCurrency } = useCurrency(); 
const formatSummaryCurrency = (amount) =>
  amount.toDecimalPlaces(2).toNumber().toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
const formatYearlyCurrency = (amount) => new Decimal(amount || 0).toDecimalPlaces(2).toNumber()
  .toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const yearlyBonusRows = computed(() => {
  const rowsByYear = new Map();
  const allowedDpcCodes = new Set(bonusStore.Dpcs.map((dpc) => dpc.dpccode));

  for (const bonus of yearlyBonusPayments.value) {
    const status = String(bonus.Status || '').trim().toLowerCase();
    if (status !== 'paid' && status !== 'unpaid') continue;

    const dpcCode = status === 'paid'
      ? bonus.PaidDPC || bonus.RegisteredDPC
      : bonus.RegisteredDPC;
    if (!dpcCode || !allowedDpcCodes.has(dpcCode)) continue;

    const year = String(bonus.BonusDate || '').slice(0, 4);
    if (!/^\d{4}$/.test(year)) continue;

    let row = rowsByYear.get(year);
    if (!row) {
      row = {
        year,
        totalPaid: new Decimal(0),
        totalUnpaid: new Decimal(0),
        total: new Decimal(0),
      };
      rowsByYear.set(year, row);
    }

    const amount = convertCurrency(bonus.BonusValue || 0, bonus.BonusDate);
    if (status === 'paid') {
      row.totalPaid = row.totalPaid.plus(amount);
    } else {
      row.totalUnpaid = row.totalUnpaid.plus(amount);
    }
    row.total = row.total.plus(amount);
  }

  return [...rowsByYear.values()].sort((left, right) => Number(left.year) - Number(right.year));
});
const yearlyBonusTotals = computed(() => yearlyBonusRows.value.reduce((totals, row) => ({
  totalPaid: totals.totalPaid.plus(row.totalPaid),
  totalUnpaid: totals.totalUnpaid.plus(row.totalUnpaid),
  total: totals.total.plus(row.total),
}), { totalPaid: new Decimal(0), totalUnpaid: new Decimal(0), total: new Decimal(0) }));
const yearlyMaximumTotal = computed(() => yearlyBonusRows.value.reduce(
  (maximum, row) => Decimal.max(maximum, row.total), new Decimal(0)
));
const yearlySegmentWidth = (amount) => yearlyMaximumTotal.value.isZero()
  ? 0
  : new Decimal(amount).div(yearlyMaximumTotal.value).mul(100).toNumber();
const searchQuery = ref(''); // Search query for filtering
const DistributorIDNO=ref('')
const totalPerDpc = ref({});
const reportOptions = [
  { label: 'Daily', value: 'daily' },
  { label: 'Paid by User per Day', value: 'user-daily' },
  { label: 'Summary', value: 'summary' },
  { label: 'Paid and Unpaid by Year', value: 'yearly' },
  { label: 'Distributors', value: 'distributors' }
];
const baseTitle = computed(() =>
  reportOptions.find((option) => option.value === reportType.value)?.label || 'Bonus Report'
);
const $q = useQuasar();
// ✅ Use computed property to access the data from Pinia store
const pivotBonusData = computed(() => bonusStore.pivotBonusData);
const grandTotal = computed(() => {
  if (!bonusStore.pivotBonusData) return 0
  return Object.values(bonusStore.pivotBonusData).reduce((sum, item) => {
    return sum + (item.total || 0)
  }, 0)
})

// Fetch user department
const userDepartment = computed(() => storeAuth.user?.department || '');

// Fetch DPCs based on the first available row in pivotBonusData
const dpcNames = computed(() => {
  if (!pivotBonusData.value || Object.keys(pivotBonusData.value).length === 0) {
    return [];
  }

  const firstRow = Object.values(pivotBonusData.value)[0]; // Get first row data
  if (!firstRow) {
    return [];
  }

  return Object.keys(firstRow).map(dpc => dpc || 'Unknown'); // Ensure no null/undefined values
});
const dpcNameByCode = computed(() => Object.fromEntries(
  bonusStore.Dpcs.map((dpc) => [dpc.dpccode, dpc.dpcname])
));
const allowedDpcCodes = computed(() => new Set(bonusStore.Dpcs.map((dpc) => dpc.dpccode)));
const isAllDpcsSelected = computed(() => bonusStore.departmentType === 'all-dpcs');
const paymentDpcIsInScope = (dpcCode) =>
  allowedDpcCodes.value.has(dpcCode) || (isAllDpcsSelected.value && !dpcCode);
const scopedDailyPaidPayments = computed(() => dailyPaidPayments.value.filter(
  (payment) => paymentDpcIsInScope(payment.PaidDPC)
));
const dailyDpcCodes = computed(() => [...new Set([
  ...bonusStore.Dpcs.map((dpc) => dpc.dpccode),
  ...dailyPaidPayments.value.map((payment) => payment.PaidDPC).filter(Boolean),
])].filter((dpcCode) => isAllDpcsSelected.value || allowedDpcCodes.value.has(dpcCode))
  .sort((left, right) => left.localeCompare(right))
  .concat(isAllDpcsSelected.value && dailyPaidPayments.value.some((payment) => !payment.PaidDPC) ? ['Unassigned'] : []));
const dailyDpcLabels = computed(() => Object.fromEntries(
  dailyDpcCodes.value.map((dpcCode) => [dpcCode, dpcNameByCode.value[dpcCode] || dpcCode])
));
// Generate all dates in range
const allDates = computed(() => {
  if (!startDate.value || !endDate.value) return [];

  return eachDayOfInterval({
    start: parseISO(startDate.value),
    end: parseISO(endDate.value),
  }).map(date => format(date, 'yyyy-MM-dd')); // Format to match DB date
})
  const userDailyDates = computed(() => [...allDates.value].sort((left, right) => right.localeCompare(left)));
  const getPaymentPaidBy = (payment) => String(payment.PaidBy || '').trim() || 'Unknown';
  const scopedUserDailyPayments = computed(() => {
    return userDailyPayments.value.filter((payment) => paymentDpcIsInScope(payment.PaidDPC));
  });
  const userDailyUsers = computed(() => [...new Set(scopedUserDailyPayments.value.map(getPaymentPaidBy))]
    .sort((left, right) => left.localeCompare(right)));
  const userDailyBreakdowns = computed(() => {
    const breakdowns = new Map();

    for (const payment of scopedUserDailyPayments.value) {
      const dpcCode = payment.PaidDPC || 'Unassigned';
      const paidBy = getPaymentPaidBy(payment);
      const key = JSON.stringify([dpcCode, paidBy]);
      if (breakdowns.has(key)) continue;

      const dpcName = dpcNameByCode.value[dpcCode] || dpcCode;
      breakdowns.set(key, {
        key: `breakdown${breakdowns.size}`,
        dpcCode,
        dpcName,
        paidBy,
        label: `${dpcName} / ${paidBy}`,
      });
    }

    return [...breakdowns.values()].sort((left, right) =>
      left.dpcName.localeCompare(right.dpcName) || left.paidBy.localeCompare(right.paidBy)
    );
  });
  const userColorClasses = [
    'text-red-9', 'text-blue-9', 'text-purple-9', 'text-teal-9', 'text-orange-10',
    'text-indigo-9', 'text-pink-9', 'text-cyan-10', 'text-brown-8', 'text-light-green-10',
  ];
  const formatUserDailyAmount = (amount) => new Decimal(amount || 0).toDecimalPlaces(2).toNumber()
    .toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const userDailyColumns = computed(() => [
    { name: 'paymentDate', label: 'Date', field: 'paymentDate', align: 'left', sortable: true },
    ...userDailyBreakdowns.value.map((breakdown) => ({
      name: breakdown.key,
      label: breakdown.label,
      field: breakdown.key,
      align: 'right',
      style: 'min-width: 130px',
      classes: `${userColorClasses[userDailyUsers.value.indexOf(breakdown.paidBy) % userColorClasses.length]} text-weight-medium`,
      headerClasses: `${userColorClasses[userDailyUsers.value.indexOf(breakdown.paidBy) % userColorClasses.length]} text-weight-bold`,
      format: formatUserDailyAmount,
    })),
    {
      name: 'totalPay',
      label: 'Total Daily Payment',
      field: 'totalPay',
      align: 'right',
      classes: 'text-weight-bold',
      headerClasses: 'text-weight-bold',
      format: formatUserDailyAmount,
    },
  ]);
  const userDailyRows = computed(() => {
    if (userDailyPayments.value.length === 0) return [];

    const totalsByDate = new Map();

    for (const payment of scopedUserDailyPayments.value) {
      const paymentDate = String(payment.PaymentDate || '').slice(0, 10);
      const breakdownKey = JSON.stringify([payment.PaidDPC || 'Unassigned', getPaymentPaidBy(payment)]);
      if (!paymentDate || !userDailyDates.value.includes(paymentDate)) continue;

      if (!totalsByDate.has(paymentDate)) totalsByDate.set(paymentDate, new Map());
      const userTotals = totalsByDate.get(paymentDate);
      const amount = convertCurrency(Number(payment.BonusValue) || 0, payment.BonusDate);
      userTotals.set(breakdownKey, (userTotals.get(breakdownKey) || new Decimal(0)).plus(amount));
    }

    return userDailyDates.value.map((paymentDate) => {
      const row = { paymentDate };
      const userTotals = totalsByDate.get(paymentDate) || new Map();
      let totalPay = new Decimal(0);

      userDailyBreakdowns.value.forEach((breakdown) => {
        const key = JSON.stringify([breakdown.dpcCode, breakdown.paidBy]);
        const amount = userTotals.get(key) || new Decimal(0);
        row[breakdown.key] = amount;
        totalPay = totalPay.plus(amount);
      });

      row.totalPay = totalPay;
      return row;
    });
  });
  const userDailyTotals = computed(() => {
    const totals = { totalPay: new Decimal(0) };

    userDailyBreakdowns.value.forEach((breakdown) => {
      const field = breakdown.key;
      totals[field] = userDailyRows.value.reduce(
        (sum, row) => sum.plus(row[field] || 0),
        new Decimal(0)
      );
      totals.totalPay = totals.totalPay.plus(totals[field]);
    });

    return totals;
  });
  const fetchDailyPaidPayments = async () => {
    if (!startDate.value || !endDate.value) return;

    dailyPaidLoading.value = true;
    dailyPaidPayments.value = [];
    const payments = [];
    const pageSize = 1000;
    let offset = 0;
    const dayAfterEndDate = format(addDays(parseISO(endDate.value), 1), 'yyyy-MM-dd');

    try {
      while (true) {
        const { data, error } = await supabase
          .from('Bonus')
          .select('PaymentDate, BonusDate, BonusValue, PaidDPC')
          .eq('Status', 'Paid')
          .gte('PaymentDate', `${startDate.value}T00:00:00`)
          .lt('PaymentDate', `${dayAfterEndDate}T00:00:00`)
          .range(offset, offset + pageSize - 1);

        if (error) throw error;
        payments.push(...(data || []));
        if (!data || data.length < pageSize) break;
        offset += pageSize;
      }

      dailyPaidPayments.value = payments;
    } catch (error) {
      console.error('Error fetching daily payments:', error);
      $q.notify({ type: 'negative', message: 'Unable to load daily payments. Confirm the PaidDPC migration has been applied.' });
    } finally {
      dailyPaidLoading.value = false;
    }
  };
  const fetchUserDailyPayments = async () => {
    if (!startDate.value || !endDate.value) return;

    userDailyLoading.value = true;
    userDailyPayments.value = [];
    const payments = [];
    const pageSize = 1000;
    let offset = 0;
    const dayAfterEndDate = format(addDays(parseISO(endDate.value), 1), 'yyyy-MM-dd');

    try {
      while (true) {
        const { data, error } = await supabase
          .from('Bonus')
          .select('PaymentDate, PaidBy, BonusValue, BonusDate, PaidDPC')
          .eq('Status', 'Paid')
          .gte('PaymentDate', `${startDate.value}T00:00:00`)
          .lt('PaymentDate', `${dayAfterEndDate}T00:00:00`)
          .range(offset, offset + pageSize - 1);

        if (error) throw error;
        payments.push(...(data || []));
        if (!data || data.length < pageSize) break;
        offset += pageSize;
      }

      userDailyPayments.value = payments;
    } catch (error) {
      console.error('Error fetching paid payments by user:', error);
      $q.notify({ type: 'negative', message: 'Unable to load paid payments by user.' });
    } finally {
      userDailyLoading.value = false;
    }
  };
  const fetchBonusPayments = async (rangeStart, rangeEnd) => {
    const bonuses = [];
    const pageSize = 1000;
    let offset = 0;

    while (true) {
      let query = supabase
        .from('Bonus')
        .select('id, DistributorIDNO, BonusDate, BonusValue, Status, PaidDPC')
        .order('id', { ascending: true })
        .range(offset, offset + pageSize - 1);

      if (rangeStart) query = query.gte('BonusDate', rangeStart);
      if (rangeEnd) query = query.lte('BonusDate', rangeEnd);

      const { data, error } = await query;
      if (error) throw error;
      bonuses.push(...(data || []));
      if (!data || data.length < pageSize) break;
      offset += pageSize;
    }

    const distributorIds = [...new Set(bonuses.map((bonus) => bonus.DistributorIDNO).filter(Boolean))];
    const registeredDpcByDistributor = new Map();

    for (let index = 0; index < distributorIds.length; index += 200) {
      const { data, error } = await supabase
        .from('Distributors')
        .select('DistributorIDNO, RegisteredDPC')
        .in('DistributorIDNO', distributorIds.slice(index, index + 200));

      if (error) throw error;
      for (const distributor of data || []) {
        registeredDpcByDistributor.set(distributor.DistributorIDNO, distributor.RegisteredDPC);
      }
    }

    return bonuses.map((bonus) => ({
      ...bonus,
      RegisteredDPC: registeredDpcByDistributor.get(bonus.DistributorIDNO) || null,
    }));
  };

  const fetchSummaryPayments = async () => {
    if (!startDate.value || !endDate.value) return;

    summaryLoading.value = true;
    summaryPayments.value = [];

    try {
      summaryPayments.value = await fetchBonusPayments(startDate.value, endDate.value);
    } catch (error) {
      console.error('Error fetching summary payments:', error);
      $q.notify({ type: 'negative', message: 'Unable to load summary. Confirm the PaidDPC migration has been applied.' });
    } finally {
      summaryLoading.value = false;
    }
  };
  const fetchYearlyBonusRecords = async (rangeStart = startDate.value, rangeEnd = endDate.value) => {
    yearlyBonusPayments.value = [];
    if (!rangeStart || !rangeEnd) {
      return;
    }
    if (rangeStart > rangeEnd) {
      $q.notify({ type: 'negative', message: 'Start date must be on or before the end date.' });
      return;
    }
    yearlyBonusLoading.value = true;
    yearlyBonusLoading.value = true;

    try {
      yearlyBonusPayments.value = await fetchBonusPayments(rangeStart, rangeEnd);
    } catch (error) {
      console.error('Error fetching yearly bonus totals:', error);
      $q.notify({ type: 'negative', message: 'Unable to load yearly bonus totals.' });
    } finally {
      yearlyBonusLoading.value = false;
    }
  };
  const scheduleYearlyBonusRefresh = () => {
    clearTimeout(yearlyBonusRefreshTimeout);
    yearlyBonusRefreshTimeout = setTimeout(fetchYearlyBonusRecords, 300);
  };
  watch(() => bonusStore.Dpcs, () => {
    if (reportType.value === 'user-daily' && startDate.value && endDate.value) {
      fetchUserDailyPayments();
    }
  });
// Prepare table rows with all dates & DPC names
const tableRows = computed(() => {
  const pivotData = bonusStore.pivotBonusData || {};
  console.log("Computed pivotData:", pivotData); // ✅ Debugging

  return allDates.value.map(date => {
    const row = { payment_date: date };
    dpcNames.value.forEach(dpc => {
      row[dpc] = pivotData[date]?.[dpc] || 0;
    });
    return row;
  });
});

// Print Report Function
const printReport = () => {
  window.print();
};



const exportToPDF = () => {
  const isDailyReport = reportType.value === "daily";
  const doc = new jsPDF({
    orientation: isDailyReport ? "landscape" : "portrait",
    unit: "mm",
    format: "a4",
  });

  // Get current date and time in a well-formatted way
  const currentDateTime = new Date().toLocaleString("en-US", {
    weekday: "short", // e.g., Mon
    year: "numeric",
    month: "short", // e.g., Mar
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true, // Ensures AM/PM format
  });

  // Set the report title
  const dateRangeText = `From: ${startDate.value} To: ${endDate.value}`;
  const title = isDailyReport ? `Daily Payments ${dateRangeText}` : `Bonus Summary ${dateRangeText}`;

  // **📌 HEADER STYLING**
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text(title, 14, 10);

  doc.setFontSize(10);
  doc.text("Generated on:", 14, 16);
  doc.setFont("helvetica", "normal");
  doc.text(currentDateTime, 45, 16); // Place it next to "Generated on:"

  doc.setFont("helvetica", "bold");
  doc.text("Generated by:", 14, 22);
  doc.setFont("helvetica", "normal");
  doc.text(storeAuth.userDetails.username, 45, 22); // Place it next to "Generated by:"

  let tableHeaders = [];
  let tableData = [];

  if (isDailyReport) {
    // **Extract data from BonusPivotTable component (Vue store)**
    if (!bonusStore.pivotBonusData || Object.keys(bonusStore.pivotBonusData).length === 0) {
      console.warn("No data available for Daily Payments report.");
      return;
    }

    tableHeaders = ["Date", ...bonusStore.dpcNames];

    // Convert Vue store data into table format
    tableData = Object.entries(bonusStore.pivotBonusData).map(([date, values]) => {
      return [date, ...bonusStore.dpcNames.map(dpc => convertCurrency(values[dpc] || 0))];
    });

    // **Fix: Calculate total correctly**
    const totalPerDpc = bonusStore.dpcNames.reduce((totals, dpc) => {
      totals[dpc] = Object.values(bonusStore.pivotBonusData).reduce((sum, values) => sum + (values[dpc] || 0), 0);
      return totals;
    }, {});

    // **Add the total row at the bottom**
    const totalRow = ["Total", ...bonusStore.dpcNames.map(dpc => convertCurrency(totalPerDpc[dpc] || 0))];
    tableData.push(totalRow);
  } else {
    // **Bonus Summary Report**
    tableHeaders = ["DPC Name", "Total Paid Bonus", "Total Unpaid Bonus", "Total Bonus"];

    document.querySelectorAll("tbody tr").forEach((row) => {
      const rowData = [];
      row.querySelectorAll("td").forEach((cell) => {
        rowData.push(cell.innerText.trim());
      });
      if (rowData.length === tableHeaders.length) {
        tableData.push(rowData);
      }
    });
  }

  // **📌 GENERATE TABLE**
  autoTable(doc, {
    head: [tableHeaders],
    body: tableData,
    startY: 30, // Adjusted to fit the new header info
    theme: "grid",
    styles: { fontSize: 8 },
    margin: { top: 30 },
    columnStyles: { 0: { cellWidth: "auto" } },
  });

  // **📌 SAVE FILE WITH CORRECT NAME**
  doc.save(`${isDailyReport ? "daily_payments" : "bonus_summary"}_report.pdf`);
};
 


const fetchData2 = async () => {
  if (!startDate.value || !endDate.value) {
    console.log("Please select a valid date range.");
    return;
  }

  if (!reportType.value) {
    console.log("Please select a report type.");
    return;
  }

  if (reportType.value === 'summary') {
    await fetchSummaryPayments();
  } else if (reportType.value === 'daily') {
    await fetchDailyPaidPayments();
  } else if (reportType.value === 'user-daily') {
    await fetchUserDailyPayments();
  } else if (reportType.value === 'yearly') {
    await fetchYearlyBonusRecords();
  } else {
    console.log("Please select a valid report type.");
  }
};

const fetchData = async () => {
  if (!startDate.value || !endDate.value) {
    console.log("Please select a valid date range.");
    return;
  }

  if (!reportType.value) {
    console.log("Please select a report type.");
    return;
  }

  if (reportType.value === 'summary') {
    await fetchSummaryPayments();
  } else if (reportType.value === 'daily') {
    await fetchDailyPaidPayments();
  } else if (reportType.value === 'user-daily') {
    await fetchUserDailyPayments();
  } else if (reportType.value === 'yearly') {
    await fetchYearlyBonusRecords();
  } else {
    console.log("Please select a valid report type.");
  }
};

// Watch for changes in searchQuery and fetch results in real time
watch(searchQuery, async (newQuery) => {
  if (newQuery.trim()) {
    await bonusStore.fetchDistributors(newQuery);
  } else {
    bonusStore.distributors = [];
  }
});

// When DPC selection changes, fetch the data based on DPC
const onDPCChange = async () => {
  await bonusStore.fetchAllDistributors1();
};

// Select distributor from search results
const selectDistributor = (distributor) => {
  if (!distributor) return;

  // Update input fields
  searchQuery.value = distributor.DistributorNames;
  DistributorIDNO.value = distributor.DistributorIDNO;

  // Store only the selected distributor for table display
  bonusStore.selectedDistributor = [distributor];

  // Clear search results
  searchQuery.value = "";
  bonusStore.distributors = [];
};


const confirmUpdate = (distributor) => {
  $q.dialog({
    title: "Confirm Update",
    message: `Are you sure you want to update the DPC for ${distributor.DistributorNames}?`,
    cancel: true,
    persistent: true,
  }).onOk(async () => {
    const result = await bonusStore.updateDPC(distributor);

    if (result.success) {
      $q.notify({ type: "positive", message: "DPC updated successfully!" });
    } else {
      $q.notify({ type: "negative", message: `Error: ${result.message}` });
    }
  });
};




const summaryRows = computed(() => {
  const rowsByDpc = new Map();
  const allowedDpcCodes = new Set(bonusStore.Dpcs.map((dpc) => dpc.dpccode));

  for (const bonus of summaryPayments.value) {
    const status = String(bonus.Status || '').trim().toLowerCase();
    if (status !== 'paid' && status !== 'unpaid') continue;

    const dpcCode = status === 'paid'
      ? bonus.PaidDPC || bonus.RegisteredDPC
      : bonus.RegisteredDPC;
    if (!dpcCode || !allowedDpcCodes.has(dpcCode)) continue;

    const dpcName = dpcNameByCode.value[dpcCode] || dpcCode;
    let summary = rowsByDpc.get(dpcCode);

    if (!summary) {
      summary = {
        dpc_name: dpcName,
        totalpaidbonus: new Decimal(0),
        totalunpaidbonus: new Decimal(0),
        totalbonus: new Decimal(0),
      };
      rowsByDpc.set(dpcCode, summary);
    }

    const amount = convertCurrency(bonus.BonusValue || 0, bonus.BonusDate);
    if (status === 'paid') {
      summary.totalpaidbonus = summary.totalpaidbonus.plus(amount);
    } else {
      summary.totalunpaidbonus = summary.totalunpaidbonus.plus(amount);
    }
    summary.totalbonus = summary.totalbonus.plus(amount);
  }

  return [...rowsByDpc.values()];
});

const totalPaidBonus = computed(() =>
  summaryRows.value.reduce((sum, bonus) => sum.plus(bonus.totalpaidbonus), new Decimal(0))
);

const totalUnpaidBonus = computed(() =>
  summaryRows.value.reduce((sum, bonus) => sum.plus(bonus.totalunpaidbonus), new Decimal(0))
);

const totalBonus = computed(() =>
  summaryRows.value.reduce((sum, bonus) => sum.plus(bonus.totalbonus), new Decimal(0))
);


// Fetch data when report type changes or user selects date
const fetchData1 = async () => {
  if (!startDate.value || !endDate.value) {
    console.log("Please select a valid date range.");
    return;
  }
  bonusStore.fetchBonusPivotTable(startDate.value, endDate.value);
};

watchEffect(() => {
  console.log("Pivot Data Updated:", bonusStore.pivotBonusData);
});

// Watch for changes in selectedDPC and fetch new distributors
watch(() => bonusStore.selectedDPC, (newDPC) => {
  if (newDPC) {
    bonusStore.fetchAllDistributors();
  }
});


onMounted(async () => {
  await bonusStore.fetchDPCs(); // Wait until DPCs are fetched
  //console.log("dpcdata", store.Dpcs); // Log after fetching
  bonusStore.selectedDPC = null;
  yearlyBonusSubscription = supabase
    .channel('yearly-bonus-report')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'Bonus' }, scheduleYearlyBonusRefresh)
    .subscribe();
});

onBeforeUnmount(() => {
  clearTimeout(yearlyBonusRefreshTimeout);
  if (yearlyBonusSubscription) supabase.removeChannel(yearlyBonusSubscription);
});
</script>

<style scoped>
.styled-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 20px;
  font-size: 14px;
  background-color: #fff;
}

.styled-table th, .styled-table td {
  padding: 12px 15px;
  text-align: left;
}

.styled-table th {
  background-color: #696464;
  color: white;
}

.styled-table tbody tr {
  transition: background-color 0.3s ease;
}

.styled-table tbody tr.inverted-row {
  background-color: #f2f2f2;
}

.styled-table tbody tr.hover-row:hover {
  background-color: #e0e0e0;
}

.styled-table td {
  border-top: 1px solid #ddd;
}

.styled-table td:first-child {
  border-left: 1px solid #ddd;
}

.styled-table th, .styled-table td {
  border-bottom: 1px solid #ddd;
}
.summary-row {
  font-weight: bold;
  background-color: #f0f0f0;
}
.search-input {
  width: 100%;
  padding: 10px;
  margin-bottom: 10px;
  border: 1px solid #ccc;
  border-radius: 5px;
}

.distributor-option {
  padding: 10px;
  cursor: pointer;
  border-bottom: 1px solid #ddd;
}

.distributor-option:hover {
  background-color: #f1f1f1;
}
.distributor-container {
  display: flex;
  align-items: center;
  gap: 8px; /* Adds spacing between the name and the GIF */
}

.loading-container {
  display: flex;
  align-items: center;
}
.yearly-chart {
  display: grid;
  gap: 12px;
}
.yearly-chart-row {
  display: grid;
  grid-template-columns: 54px minmax(80px, 1fr) minmax(90px, auto);
  align-items: center;
  gap: 12px;
}
.yearly-chart-year,
.yearly-chart-total {
  font-size: 13px;
  font-variant-numeric: tabular-nums;
}
.yearly-chart-total {
  text-align: right;
}
.yearly-chart-track {
  display: flex;
  height: 20px;
  overflow: hidden;
  border-radius: 2px;
  background: #edf0f2;
}
.yearly-chart-paid {
  background: #168b73;
}
.yearly-chart-unpaid {
  background: #e3a329;
}
.yearly-legend {
  display: inline-block;
  width: 10px;
  height: 10px;
  margin-right: 5px;
  border-radius: 2px;
  vertical-align: -1px;
}
.yearly-legend.paid {
  background: #168b73;
}
.yearly-legend.unpaid {
  background: #e3a329;
}
@media (max-width: 520px) {
  .yearly-chart-row {
    grid-template-columns: 42px minmax(40px, 1fr) 75px;
    gap: 8px;
  }
  .yearly-chart-year,
  .yearly-chart-total {
    font-size: 11px;
  }
}
</style>
