<template>
  <q-page class="q-pa-md">
    <q-card class="q-pa-md" flat>
      <div class="q-pa-md">
        <q-input v-model="startDate" label="Start Date" type="date" filled dense class="q-mb-md" />
        <q-input v-model="endDate" label="End Date" type="date" filled dense class="q-mb-md" />

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

        <q-btn label="Filter" color="primary" @click="fetchData" class="q-mt-md full-width" />
      </div>

      <q-card class="q-mt-md">
     
        <q-item-label header class="row items-center justify-between">
          <div>
            <span class="text-lg text-bold">{{ baseTitle }}</span> 
            <span v-if="start && end"> ({{ start }} - {{ end }})</span>
          </div>
        </q-item-label>

        <template v-if="reportType === 'daily'">
          
          <div v-if="pivotBonusData && Object.keys(pivotBonusData).length > 0">
            <div class="">Bonus Report</div>
            <q-col cols="6" class="q-gutter-sm flex justify-end items-center">
  <q-btn flat dense round icon="print" @click="printReport" color="primary">
    <q-tooltip>Print Report</q-tooltip>
  </q-btn>

  <q-btn flat dense round icon="picture_as_pdf" @click="exportToPDF" color="red">
    <q-tooltip>Export to PDF</q-tooltip>
  </q-btn>
</q-col>

            <BonusPivotTable :pivotData="bonusStore.pivotBonusData" :dpcNames="bonusStore.dpcNames"/>
          <!-- Total Row -->
    <!-- Total Row -->
       <!-- Grand Total -->
    
    
  </div>
      <div v-else>
            <p>No data available for the selected date range.</p>
          </div>
        </template>
        <template v-if="reportType === 'summary'">
          <q-row class="items-center justify-between q-mb-md">
    <!-- Left: Currency Selection -->
    <q-col cols="12">
  <div class="row items-center q-gutter-md">
    <q-radio v-model="currencyType" label="USD" val="USD" color="primary" />
    <q-radio v-model="currencyType" label="Local Currency" val="LC" color="primary" />
    <DepartmentTypeSelector />
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
      <tr v-for="(bonus, index) in bonusStore.bonusData" :key="index" :class="{'hover-row': true, 'inverted-row': index % 2 === 0}">
        <td>{{ bonus.dpc_name }}</td>
        <td>{{ convertCurrency(bonus.totalpaidbonus || 0).toLocaleString() }}</td>
        <td>{{ convertCurrency(bonus.totalunpaidbonus || 0).toLocaleString() }}</td>
        <td>{{ convertCurrency(bonus.totalbonus || 0).toLocaleString() }}</td>
      </tr>
     <tr>
      <td><strong>Total</strong></td>
      <td><strong>{{ convertCurrency(totalPaidBonus).toLocaleString() }}</strong></td>
      <td><strong>{{ convertCurrency(totalUnpaidBonus).toLocaleString() }}</strong></td>
      <td><strong>{{ convertCurrency(totalBonus).toLocaleString() }}</strong></td>
     </tr>
     
    </tbody>
  </table>
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
import { ref, computed, onMounted,watch,watchEffect } from 'vue';
import { useBonusStore } from 'src/stores/bonusStore';
import { useStoreAuth } from 'src/stores/storeAuth';
import { format, eachDayOfInterval, parseISO } from 'date-fns';
import BonusPivotTable from 'src/components/BonusPivotTable.vue';
import { useCurrency } from 'src/composables/useCurrency';
import DepartmentTypeSelector from '../components/DepartmentTypeSelector.vue';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import departmenttype from '../components/DepartmentTypeSelector.vue'
import { useQuasar } from "quasar";
const startDate = ref('');
const endDate = ref('');
const reportType = ref('daily');
const bonusStore = useBonusStore();
const storeAuth = useStoreAuth(); // Get user info
const { currencyType, convertCurrency } = useCurrency(); 
const searchQuery = ref(''); // Search query for filtering
const DistributorIDNO=ref('')
const totalPerDpc = ref({});
const reportOptions = [
  { label: 'Daily', value: 'daily' },
  { label: 'Summary', value: 'summary' },
  { label: 'Distributors', value: 'distributors' }
];
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
// Generate all dates in range
const allDates = computed(() => {
  if (!startDate.value || !endDate.value) return [];

  return eachDayOfInterval({
    start: parseISO(startDate.value),
    end: parseISO(endDate.value),
  }).map(date => format(date, 'yyyy-MM-dd')); // Format to match DB date
})
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
    //await bonusStore.fetchBonusData(startDate.value, endDate.value);
    await bonusStore.fetchBonusSummary(startDate.value, endDate.value);
  } else if (reportType.value === 'daily') {
    await bonusStore.fetchBonusPivotTable(startDate.value, endDate.value);
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
    if (bonusStore.departmentType === 'my-department') {
      await bonusStore.fetchBonusSummary(startDate.value, endDate.value);
    } else if (bonusStore.departmentType === 'all-dpcs') {
      await bonusStore.summarizeAll(startDate.value, endDate.value);
    } else {
      console.log("Please select a valid department type.");
    }
  } else if (reportType.value === 'daily') {
    await bonusStore.fetchBonusPivotTable(startDate.value, endDate.value);
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




const totalPaidBonus = computed(() =>
  bonusStore.bonusData.reduce((sum, bonus) => sum + (bonus.totalpaidbonus || 0), 0)
);

const totalUnpaidBonus = computed(() =>
  bonusStore.bonusData.reduce((sum, bonus) => sum + (bonus.totalunpaidbonus || 0), 0)
);

const totalBonus = computed(() =>
  bonusStore.bonusData.reduce((sum, bonus) => sum + (bonus.totalbonus || 0), 0)
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
</style>
