<template>
  <q-page class="q-pa-md">
    <q-card flat>
      <div class="q-pa-md">
  <q-input v-model="startDate" label="Start Date" type="date" filled dense class="q-mb-md" />
  <q-input v-model="endDate" label="End Date" type="date" filled dense class="q-mb-md" />
  <q-input v-model="DistributorIDNO" label="Distributor ID" filled dense class="q-mb-md" />
  
  <input
      v-model="searchQuery"
      type="text"
      placeholder="Search by name"
      class="search-input"
    />
    
    <ul v-if="filteredDistributors.length && searchQuery.trim() !== ''">
      <li
        v-for="distributor in filteredDistributors"
        :key="distributor.DistributorIDNO"
        @click="selectDistributor(distributor)"
        class="distributor-option"
      >
        {{ distributor.DistributorNames }}
        
      </li>
    </ul>

    <p v-else>No results found</p>

 

<q-select
  v-model="selectedDPC"
  :options="store.Dpcs"
  label="Select DPC"
  option-value="dpccode"
  option-label="dpcname"
  filled
  dense
  
  emit-value
  map-options
  @update:model-value="fetchBonuses()"
/>

  <q-btn label="Search" color="primary" @click="fetchBonuses" class="q-mt-md full-width" />
</div>

     
<q-row class="q-mt-md items-center">
  <!-- Left: Radio Buttons --> 

  <q-col cols="12">
  <div class="row items-center q-gutter-md">
    <q-radio v-model="currencyType" label="USD" val="USD" color="primary" />
    <q-radio v-model="currencyType" label="Local Currency" val="LC" color="primary" />
    <DepartmentTypeSelector />
    <q-btn flat dense round icon="print" @click="printReport" color="primary">
        <q-tooltip>Print Report</q-tooltip>
      </q-btn>
      
      <q-btn flat dense round icon="picture_as_pdf" @click="exportToPDF" color="red">
        <q-tooltip>Export to PDF</q-tooltip>
      </q-btn>

  </div>
</q-col>
  

  <!-- Center: Title -->
  <q-col cols="4" class="text-center text-bold">
    <div v-if="!loading && (selectedDPC || searchQuery || DistributorIDNO)" class="text-bold text-primary">
  <div v-if="selectedDPC && !searchQuery && !DistributorIDNO">
    <div>Bonus For:</div>
    <div>{{ selectedDPC }}</div>
    <div>Date Range: {{ startDate }} to {{ endDate }}</div>
  </div>

  <div v-else-if="searchQuery && DistributorIDNO">
    <div>Bonus For:</div>
    <div>{{ searchQuery }} (ID: {{ DistributorIDNO }})</div>
    <div>Date Range: {{ startDate }} to {{ endDate }}</div>
  </div>

  <div v-else-if="DistributorIDNO && !searchQuery">
    <div>Bonus For:</div>
    <div>Distributor ID: {{ DistributorIDNO }}</div>
    <div>From: {{ startDate }} to {{ endDate }}</div>
  </div>

  <div v-else-if="searchQuery && !DistributorIDNO">
    <div>Bonus For:</div>
    <div>{{ searchQuery }}</div>
    <div>From: {{ startDate }} to {{ endDate }}</div>
  </div>

  <div v-else>
    <div>Bonus List between:</div>
    <div>{{ startDate }} and {{ endDate }}</div>
  </div>
</div>



  </q-col>

  <!-- Right: Date Range & DPC -->
  <q-col cols="4" class="text-right">
    <div class="text-bold q-mr-md">
      <div v-if="store.bonuses.length">
        <div class="row q-gutter-sm justify-center">
            <!-- Counter Card 1 -->
            <q-card class="bg-green-5 text-white flex flex-col items-center justify-center hover-card" style="width: 190px; cursor: pointer; border-radius: 20px">
      <q-card-section class="text-center">
        <div class="text-h6">Total Paid</div>
        <div class="text-h4 q-mt-md">
          <span :class="{'text-caption': true}">{{ currencyType === 'LC' ? 'FC' : 'USD' }}</span>
          <span class="counter-value">

            {{ convertCurrency(totalPaid).toNumber().toLocaleString(undefined, {
  minimumFractionDigits: 0,
  maximumFractionDigits: 20
}) }}
          </span>
        </div>
      </q-card-section>
    </q-card>

    <!-- Counter Card 2 -->
    <q-card
  class="bg-orange-5 text-white flex flex-col items-center justify-center hover-card"
  style="width: 190px; cursor: pointer; border-radius: 20px"
>
  <q-card-section class="text-center">
    <div class="text-h6">Total UnPaid</div>
    <div class="text-h4 q-mt-md">
      <span :class="{'text-caption': true}">{{ currencyType === 'LC' ? 'FC' : 'USD' }}</span>
      <span class="counter-value">
        {{ convertCurrency(totalUnPaid).toNumber().toLocaleString(undefined, {
  minimumFractionDigits: 0,
  maximumFractionDigits: 20
}) }}
      </span>
    </div>
  </q-card-section>
</q-card>
          
  
  </div>
    </div>
    </div>
   
  </q-col>
</q-row>

      <q-card class="full-width q-mt-md" flat>
          <!-- Search input field -->
 
  <q-card-section>

    <q-table
        flat
        bordered
        dense
        :rows="filteredBonuses"
        :columns="columns"
        row-key="id"
      >
      <!-- Bonus Date -->
      <template v-slot:body-cell-bonusDate="props">
        <q-td :props="props">
          <strong>{{ props.row.BonusDate }}</strong>
        </q-td>
      </template>

    

<template v-slot:body-cell-distributorName="props">
  <q-td :props="props">
    <div class="distributor-container">
      <span>{{ props.row.DistributorName }}</span>
      
     
    </div>
  </q-td>
</template>
      <!-- Bonus Value -->
      <template v-slot:body-cell-bonusValue="props">
              <q-td :props="props">
                <span class="text-red-300">
                  <strong>
               {{ convertCurrency(props.row.BonusValue).toNumber().toLocaleString(undefined, {
  minimumFractionDigits: 0,
  maximumFractionDigits: 20
}) }}


                </strong>
                </span>
              </q-td>
            </template>

      <!-- Payment Date (Only if Paid) -->
      <template v-slot:body-cell-paymentDate="props">
  <q-td :props="props">
    <span v-if="props.row.Status === 'Paid'">{{ formatDate(props.row.PaymentDate) }}</span>
    <span v-else>N/A</span>
    <div v-if="props.row.Status === 'Paid'" class="text-indigo-10 text-caption q-mt-xs">
      PaidBy: {{ props.row.PaidBy }}
    </div>
    <div v-if="loadingStatus[props.row.id]" class="loading-container">
        <img
          src="../assets/orange_circles.gif"
          alt="Loading"
          width="22"
          height="22"
        />
      </div>
  </q-td>
 
</template>

      <!-- Status Button -->
      <template v-slot:body-cell-status="props">
<q-td :props="props">
 
  <div class="row items-center no-wrap">
    
    <q-btn
      size="10px"
      :color="props.row.Status === 'Paid' ? 'green-5' : 'orange-5'"
      :label="props.row.Status"
      :disable="props.row.Status === 'Paid'"
      @click="confirmUpdate(props.row.id)"
    />
    
    <!-- Show undo icon only when Status is 'Paid' and role is 'SuperAdmin' -->
    <q-btn
  v-if="props.row.Status === 'Paid' && storeAuth.userDetails?.role === 'SuperAdmin'"
  @click="confirmReverseStatus(props.row.id)"
   round 
   color="orange-5" 
   icon="undo"
   size="xs"
    class="q-ml-sm"
    />
   
  </div>
</q-td>
<td>
  <div v-if="props.row?.Status === 'Paid'" class="text-indigo-10 text-caption q-mt-xs">
  
    
    <!-- Local temporary state for each row -->
    <q-input 
  v-model="props.row.PickedBy"  
  dense 
  outlined 
  placeholder="Taken By" 
  class="q-ml-sm"
  @blur="store.updateTakenBy(props.row.id, props.row.PickedBy)" 
/>

  </div>
</td>


      </template>

    </q-table>
  </q-card-section>

</q-card>

    <div v-if="store.bonuses.length">Total:</div>

      <q-spinner v-if="store.loading" class="q-mt-md" color="primary" size="lg" />
    </q-card>
  </q-page>
</template>

<script setup>
import { supabase } from "../boot/supabase";
import { ref, onMounted,watch,computed,watchEffect, onUnmounted} from "vue";
import { useBonusStore } from "../stores/bonusStore";
import { useCurrency } from "src/composables/useCurrency";
import { useStoreAuth } from "src/stores/storeAuth";
import DepartmentTypeSelector from "../components/DepartmentTypeSelector.vue"
import { useQuasar } from 'quasar';
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
const searchQuery = ref(''); // Search query for filtering
const distributors = ref([]);
const filteredDistributors = ref([]);
const exchangeRate = 600;
const selectedDPC=ref(null)

const store = useBonusStore();
const storeAuth=useStoreAuth()
const startDate = ref(null);
const endDate = ref(null);
const DistributorIDNO = ref("");
const loading = ref(false); // Loading state
const loadingStatus = ref({}); // Store loading state for each row
const { currencyType, convertCurrency } = useCurrency();  // Destructure the state and function
const currentUser=storeAuth.userDetails.username
const $q=useQuasar()
const formatDate = (dateString) => {
const date = new Date(dateString);





  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });
};

const columns = [
  { name: 'bonusDate', label: 'Bonus Date', align: 'left', field: 'BonusDate' },
  { name: 'distributorName', label: 'Distributor Name', align: 'left', field: 'DistributorName' }, // Updated
  { name: 'bonusValue', label: 'Bonus Value', align: 'left', field: 'BonusValue' },
  { name: 'paymentDate', label: 'Payment Date', align: 'left', field: 'PaymentDate' },
  { name: 'status', label: 'Status', align: 'center', field: 'Status' },
  { name: 'TakenBy', label: 'Taken By', align: 'center',  },
];

const confirmUpdate1 = (id) => {
  $q.dialog({
    title: 'Confirm Update',
    message: 'Are you sure you want to update the status?',
    cancel: true,
    persistent: true
  }).onOk(() => {
    store.updateStatus(id);
  }).onCancel(() => {
    console.log('Update canceled');
  });
};

const confirmUpdate = (id) => {
  $q.dialog({
    title: 'Confirm Update',
    message: 'Are you sure you want to update the status?',
    cancel: true,
    persistent: true
  }).onOk(async () => {
    loadingStatus.value[id] = true; // Start loading
    try {
      await store.updateStatus(id); // Call the update function
    } catch (error) {
      console.error('Update failed:', error);
    } finally {
      loadingStatus.value[id] = false; // Stop loading
    }
  }).onCancel(() => {
    console.log('Update canceled');
  });
};
const confirmReverseStatus1 = (id) => {
  $q.dialog({
    title: 'Confirm Reversal',
    message: 'Are you sure you want to revert the status to UnPaid?',
    cancel: true,
    persistent: true
  }).onOk(() => {
    store.reverseStatus(id);
  }).onCancel(() => {
    console.log('Reversal canceled');
  });
};

const confirmReverseStatus = (id) => {
  $q.dialog({
    title: 'Confirm Reversal',
    message: 'Are you sure you want to revert the status to UnPaid?',
    cancel: true,
    persistent: true
  }).onOk(async () => {
    loadingStatus.value[id] = true; // Start loading
    try {
      await store.reverseStatus(id); // Call the reversal function
    } catch (error) {
      console.error('Reversal failed:', error);
    } finally {
      loadingStatus.value[id] = false; // Stop loading
    }
  }).onCancel(() => {
    console.log('Reversal canceled');
  });
};



const fetchDistributors = async (query) => {
  const { data, error } = await supabase
    .from('Distributors')
    .select('DistributorIDNO, DistributorNames')
    .ilike('DistributorNames', `%${query}%`);

  if (error) {
    console.error("Error fetching distributors:", error);
  } else {
    distributors.value = data;
  }
};
// Select a distributor from the list
const selectDistributor = (distributor) => {
  // Populate the search field and Distributor ID input
  searchQuery.value = distributor.DistributorNames;
  DistributorIDNO.value = distributor.DistributorIDNO;

  // Optionally, clear the list of filtered results after selection
  filteredDistributors.value = [];

  // Focus on the search input field again
  document.querySelector('.search-input').focus();
};

const exportToPDF = () => {
  if (!Array.isArray(filteredBonuses.value) || filteredBonuses.value.length === 0) {
    // **📌 Show a popup message instead of exporting**
    $q.dialog({
      title: "No Data",
      message: "No data selected to export.",
      ok: "OK",
    });
    return;
  }

  // Convert totals to numbers first
  const paidTotal = Number(totalPaid.value);
  const unpaidTotal = Number(totalUnPaid.value);

  if (isNaN(paidTotal) || isNaN(unpaidTotal)) {
    console.error("Error: Totals contain NaN", { paidTotal, unpaidTotal });
    return;
  }

  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  // Get current date and time
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

  const dateRangeText = `From: ${startDate.value} To: ${endDate.value}`;
  const title = `Bonus Report`;
  const generatedBy = `Generated by: ${storeAuth.userDetails.username}`;
  const totalPaidFormatted = convertCurrency(paidTotal).toLocaleString();
  const totalUnPaidFormatted = convertCurrency(unpaidTotal).toLocaleString();

  // **📌 HEADER STYLING**
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text(title, 14, 10); // Main Title

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Generated on: ${currentDateTime}`, 14, 16); // Current Date and Time
  doc.text(dateRangeText, 14, 22);
  doc.text(generatedBy, 14, 28);

  // **📌 TOTALS (Bold, Larger & Distinct)**
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(0, 128, 0); // Green for Paid
  doc.text(`Total Paid: ${currencyType.value === 'LC' ? 'FC' : 'USD'} ${totalPaidFormatted}`, 14, 36);

  doc.setTextColor(255, 165, 0); // Orange for Unpaid
  doc.text(`Total Unpaid: ${currencyType.value === 'LC' ? 'FC' : 'USD'} ${totalUnPaidFormatted}`, 14, 44);

  // Reset text color for table
  doc.setTextColor(0, 0, 0);

  // **📌 TABLE HEADERS**
  const tableHeaders = [
    "Bonus Date",
    "Distributor Name",
    "Bonus Value",
    "Payment Date",
    "Status",
    "Taken By",
  ];

  // Convert filteredBonuses into table data
  const tableData = filteredBonuses.value.map((bonus) => [
    bonus.BonusDate,
    bonus.DistributorName,
    convertCurrency(Number(bonus.BonusValue)), // Ensure it's a number
    bonus.Status === "Paid" ? formatDate(bonus.PaymentDate) : "N/A",
    bonus.Status,
    bonus.PickedBy || "N/A",
  ]);

  // **📌 GENERATE TABLE**
  autoTable(doc, {
    head: [tableHeaders],
    body: tableData,
    startY: 50, // Ensure it starts below totals
    theme: "grid",
    styles: { fontSize: 8 },
    margin: { top: 30 },
    columnStyles: { 0: { cellWidth: "auto" } },
  });

  // Save PDF
  doc.save("bonus_report.pdf");
};

// Print Report Function
const printReport = () => {
  window.print();
};



// Watch for changes in searchQuery and fetch matching distributors
watchEffect(() => {
  if (searchQuery.value.trim() !== '') {
    fetchDistributors(searchQuery.value);
  } else {
    distributors.value = [];
  }
});

// Filter distributors based on searchQuery
watchEffect(() => {
  filteredDistributors.value = distributors.value.filter((distributor) =>
    distributor.DistributorNames.toLowerCase().includes(searchQuery.value.toLowerCase())
  );
});



const fetchBonuses1 = () => {
  loading.value = true; // Show loader

  // If a searchQuery is present, reset filters to fetch the entire dataset
  if (searchQuery.value) {
    //DistributorIDNO.value = null;
    selectedDPC.value = null; // Reset selectedDPC
  }

  // Step 1: Fetch all bonuses within the date range (unfiltered)
  store.fetchBonuses(startDate.value, endDate.value, DistributorIDNO.value, selectedDPC.value)
    .then(() => {
      // Step 2: Apply search query if there's one
      if (searchQuery.value) {
        // Only filter after fetching complete data
        store.fetchBonuses(startDate.value, endDate.value, null, null, searchQuery.value);
      }
    })
    .finally(() => {
      loading.value = false; // Hide loader when fetching is done
    });
};

const fetchBonuses = () => {
  loading.value = true; // Show loader

  // Reset selectedDPC if searchQuery is present
  if (searchQuery.value) {
    selectedDPC.value = null; // Reset selectedDPC
  }

  // Step 1: Fetch all bonuses within the date range (unfiltered)
  store.fetchBonuses(startDate.value, endDate.value, DistributorIDNO.value, selectedDPC.value)
    .then(() => {
      // Step 2: Apply search query if there's one
      if (searchQuery.value) {
        // Filter locally after fetching complete data
        store.bonuses = store.bonuses.filter(bonus =>
          bonus.DistributorName.toLowerCase().includes(searchQuery.value.toLowerCase())
        );
      }
    })
    .finally(() => {
      loading.value = false; // Hide loader when fetching is done
    });
};



const formattedDateRange = computed(() => {
  if (!startDate.value || !endDate.value) return "";
  
  const options = { month: "long", day: "2-digit" };
  const start = new Date(startDate.value).toLocaleDateString("en-US", options);
  const end = new Date(endDate.value).toLocaleDateString("en-US", options);

  return `${start} - ${end}`;
});



const filterBonuses3 = () => {
  fetchBonuses(); // Re-fetch with the search term
};

// Computed property to filter bonuses by search query
const filteredBonuses2 = computed(() => {
  const bonuses = store.bonuses;
  if (!searchQuery.value) {
    return bonuses; // If no search query, show all bonuses
  }
  return bonuses.filter(bonus => 
    bonus.DistributorName.toLowerCase().includes(searchQuery.value.toLowerCase())
  );
});
// Computed property to calculate total paid bonuses dynamically

// Computed property to filter bonuses by search query


const filteredBonuses = computed(() => {
  const bonuses = store.bonuses;
  if (!searchQuery.value) {
    //console.log("Filtered Bonuses:", bonuses); // Log all bonuses when no search query
    return bonuses;
  }

  const filtered = bonuses.filter(bonus => 
    bonus.DistributorName.toLowerCase().includes(searchQuery.value.toLowerCase())
  );

  console.log("Filtered Bonuses with Search Query:", filtered); // Log filtered bonuses
  return filtered;
});

const totalPaid = computed(() => {
  return filteredBonuses2.value
    .filter(bonus => bonus.Status === 'Paid')
    .reduce((sum, bonus) => sum + (Number(bonus.BonusValue) || 0), 0) .toFixed(2); // Round to 2 decimal places; // Convert to number
});

const totalUnPaid = computed(() => {
  return filteredBonuses2.value
    .filter(bonus => bonus.Status === 'UnPaid')
    .reduce((sum, bonus) => sum + (Number(bonus.BonusValue) || 0), 0) .toFixed(2); // Round to 2 decimal places; // Convert to number
});





onMounted(async () => {
  await store.fetchDPCs(); // Wait until DPCs are fetched
  //console.log("dpcdata", store.Dpcs); // Log after fetching
 
  store.fetchBonuses();
  store.subscribeToBonuses(); // Subscribe to real-time updates
});

// Optional: Watch for changes in dpcs and log when updated
watch(() => store.Dpcs, (newDpcs) => {
  //console.log("Updated DPCs:", newDpcs);
});
onUnmounted(() => {
  store.unsubscribeFromBonuses(); // Unsubscribe when leaving page
});

</script>

<style scoped>
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
.counter-value {
  animation: counterAnimation 1s ease-in-out;
}

@keyframes counterAnimation {
  0% {
    transform: scale(0.8);
    opacity: 0;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

.hover-card {
  transition: transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out;
}

.hover-card:hover {
  transform: scale(1.05);
  box-shadow: 0px 4px 20px rgba(0, 0, 0, 0.2);
}
</style>
