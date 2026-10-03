<template>
   <q-layout view="hHh lpR lFf">
    <q-header :elevated="useLightOrDark(true, false)">

      <q-toolbar>
    <q-btn
      flat
      dense
      round
      icon="menu"
      aria-label="Menu"
      @click="toggleLeftDrawer"
    />

    <q-toolbar-title>
      <span class="text-orange-5">Dyna</span> Bonus
    </q-toolbar-title>

    <div class="text-body1 ">
      <q-icon name="people" size="19px" />
      {{storeAuth.userDetails.username}}
      
    </div>
  </q-toolbar>
    </q-header>

    <q-drawer v-model="leftDrawerOpen" class="bg-primary" :width="200" :breakpoint="767" show-if-above bordered>

    
     
      <q-list>
        <q-item-label
        class="text-white"
          header
        >
        
         <div class="q-mt-xs">
          {{storeAuth.userDetails.email}}
         </div>
        
        </q-item-label>

        <NavLink
          v-for="link in NavLinks"
          :key="link.title"
          v-bind="link"
        />
        <q-item class="text-white">
          <q-item-section>
            <DepartmentTypeSelector />
            <div class="column items-start q-gutter-y-xs q-mt-sm">
              <q-radio
                v-model="currencyType"
                label="USD"
                val="USD"
                :color="currencyType === 'USD' ? 'orange-5' : 'white'"
                :class="{ 'text-orange-5': currencyType === 'USD' }"
                dense
              />
              <q-radio
                v-model="currencyType"
                label="Local Currency"
                val="LC"
                :color="currencyType === 'LC' ? 'orange-5' : 'white'"
                :class="{ 'text-orange-5': currencyType === 'LC' }"
                dense
              />
            </div>
            <template v-if="storeAuth.userDetails.role === 'SuperAdmin'">
              <div class="text-caption text-weight-bold q-mt-md">Payments Today</div>
              <div class="row justify-between text-caption text-orange-5 q-mt-xs">
                <span>PaidBy</span>
                <span>Amount ({{ currencyType === 'LC' ? 'FC' : 'USD' }})</span>
              </div>
              <div
                v-for="payment in todayPaymentsByUser"
                :key="payment.paidBy"
                class="row justify-between items-start text-caption q-mt-xs"
              >
                <span class="today-payment-name">{{ payment.paidBy }}</span>
                <span class="text-right">{{ formatPaymentAmount(payment.amount) }}</span>
              </div>
            </template>
          </q-item-section>
        </q-item>
        <q-item>
          <div>
   
      <q-btn
      @click="storeAuth.logoutUser"
       flat 
       rounded 
       color="orange-5" 
       label="LogOut"
       icon="power_settings_new"
        />
        <div
        v-if="storeAuth.userDetails.email"
    class="text-white"
     caption
     >
     <q-separator />
     <div class="q-mt-xs">
      
      <div class="date-time"><q-icon name="watch_later" size="13px" />{{ currentDateTime }}</div>
     </div>

    </div>
    </div>
    
        </q-item>
    
      </q-list>
    

    </q-drawer>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import EssentialLink from 'components/EssentialLink.vue'
import { useLightOrDark } from 'src/use/useLightOrDark'
import { useRouter } from 'vue-router'
import NavLink from 'src/components/Nav/NavLink.vue'
import DepartmentTypeSelector from 'src/components/DepartmentTypeSelector.vue'
import { useStoreAuth } from 'src/stores/storeAuth'
import { useBonusStore } from 'src/stores/bonusStore'
import { useCurrency } from 'src/composables/useCurrency'
import Decimal from 'decimal.js'
const router = useRouter()
const storeAuth=useStoreAuth()
const bonusStore = useBonusStore()
const { currencyType, convertCurrency } = useCurrency()
const currentDateTime = ref('')
const todayPaymentsByUser = computed(() => {
  const totalsByPaidBy = new Map()

  for (const bonus of bonusStore.todayPaidBonuses) {
    const paidBy = String(bonus.PaidBy || '').trim() || 'Unknown'
    const amount = convertCurrency(Number(bonus.BonusValue) || 0, bonus.BonusDate)
    totalsByPaidBy.set(paidBy, (totalsByPaidBy.get(paidBy) || new Decimal(0)).plus(amount))
  }

  return [...totalsByPaidBy.entries()]
    .map(([paidBy, amount]) => ({ paidBy, amount }))
    .sort((left, right) => left.paidBy.localeCompare(right.paidBy))
})
const formatPaymentAmount = (amount) => amount.toDecimalPlaces(2).toNumber().toLocaleString(undefined, {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})
const getLocalDateKey = () => {
  const today = new Date()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const day = String(today.getDate()).padStart(2, '0')
  return `${today.getFullYear()}-${month}-${day}`
}
let dailyPaymentsRefreshTimer
defineOptions({
  name: 'MainLayout'
})

const NavLinks = [
  {
    title: 'Bonus',
    icon: 'account_balance_wallet',
    link: '/'
  },
  {
    title: 'Reports',
    icon: 'description',
    link: '/reports'
  },
  {
    title: 'Users',
    icon: 'people',
    link: '/users'
  },

  {
    title: 'Settings',
    icon: 'settings',
    link: '/settings'
  }
 
]


const leftDrawerOpen = ref(false)

function toggleLeftDrawer () {
  leftDrawerOpen.value = !leftDrawerOpen.value
}
const refreshTodayPayments = () => {
  const today = getLocalDateKey()
  return bonusStore.fetchPaidBonusesByPaymentDate(today, today)
}

watch(() => storeAuth.userDetails.role, async (role) => {
  clearInterval(dailyPaymentsRefreshTimer)

  if (role !== 'SuperAdmin') {
    bonusStore.unsubscribeFromTodayPaidBonuses()
    bonusStore.todayPaidBonuses = []
    return
  }

  bonusStore.subscribeToTodayPaidBonuses()
  await refreshTodayPayments()
  dailyPaymentsRefreshTimer = setInterval(refreshTodayPayments, 5 * 60 * 1000)
}, { immediate: true })

onMounted(() => {
  // Proceed with your logic if user details are valid
  const now = new Date()
  const day = String(now.getDate()).padStart(2, '0')
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const year = now.getFullYear()
  const hours = String(now.getHours()).padStart(2, '0')
  const minutes = String(now.getMinutes()).padStart(2, '0')

  currentDateTime.value = `${day}:${month}:${year}:${hours}:${minutes}`
})

onUnmounted(() => {
  clearInterval(dailyPaymentsRefreshTimer)
  bonusStore.unsubscribeFromTodayPaidBonuses()
})


</script>

<style scoped>
.today-payment-name {
  max-width: 55%;
  overflow-wrap: anywhere;
}
</style>
