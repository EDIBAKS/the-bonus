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
import { ref,onMounted } from 'vue'
import EssentialLink from 'components/EssentialLink.vue'
import { useLightOrDark } from 'src/use/useLightOrDark'
import { useRouter } from 'vue-router'
import NavLink from 'src/components/Nav/NavLink.vue'
import { useStoreAuth } from 'src/stores/storeAuth'
const router = useRouter()
const storeAuth=useStoreAuth()
const currentDateTime = ref('')
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
onMounted(async () => {
 

  // Proceed with your logic if user details are valid
  const now = new Date()
  const day = String(now.getDate()).padStart(2, '0')
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const year = now.getFullYear()
  const hours = String(now.getHours()).padStart(2, '0')
  const minutes = String(now.getMinutes()).padStart(2, '0')

  currentDateTime.value = `${day}:${month}:${year}:${hours}:${minutes}`
})


</script>
