<template>
    <div class="column items-start q-gutter-y-xs">
      <!-- My Department Radio -->
      <q-radio
        v-model="bonusStore.departmentType"
        val="my-department"
        :color="bonusStore.departmentType === 'my-department' ? 'orange-5' : 'white'"
        dense
        :label="`My Department`"
        :class="{ 'text-orange-5': bonusStore.departmentType === 'my-department' }"
      />
      <!-- All DPCs Radio -->
      <q-radio
  v-model="bonusStore.departmentType"
  val="all-dpcs"
  :color="bonusStore.departmentType === 'all-dpcs' ? 'orange-5' : 'white'"
  dense
  :label="`All DPCs`"
  :class="{ 'text-orange-5': bonusStore.departmentType === 'all-dpcs' }"
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
  