<template>
    <div>
      <!-- My Department Radio -->
      <q-radio
        v-model="bonusStore.departmentType"
        val="my-department"
        color="green-7"
        class="q-ml-xl"
        :label="`My Department`"
        :class="{ 'text-green-7': bonusStore.departmentType === 'my-department' }"
      />
      <!-- All DPCs Radio -->
      <q-radio
  v-model="bonusStore.departmentType"
  val="all-dpcs"
  color="green-7"
  :label="`All DPCs`"
  :class="{ 'text-green-7': bonusStore.departmentType === 'all-dpcs' }"
   :disable="!(storeAuth.userDetails?.role === 'SuperAdmin' && storeAuth.userDetails?.department === 'Brazzaville')"
/>
    </div>
  </template>
  
  <script setup>
  import { watch } from 'vue';
  import { useBonusStore } from 'stores/bonusStore'; // Import store
  import { useStoreAuth } from "src/stores/storeAuth";
  const bonusStore = useBonusStore();
  const storeAuth=useStoreAuth();
  // Watch for changes in departmentType and fetch DPCs
  watch(() => bonusStore.departmentType, async (newValue) => {
    //console.log(`Department Type changed to: ${newValue}`);
    await bonusStore.fetchDPCs();
  }, { immediate: true });
  </script>
  