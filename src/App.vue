<template>
  <router-view v-if="storeAuth.isAuthenticated || $route.path === '/auth'" />
</template>

<script setup>
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { useStoreSettings } from 'src/stores/storeSettings'
import { useStoreAuth } from 'src/stores/storeAuth'


defineOptions({
  name: 'App'
});

const storeSettings = useStoreSettings()
const storeAuth= useStoreAuth(),
           $q = useQuasar(),
      router = useRouter()

onMounted(() => {
  storeSettings.loadSettings()
  

  if ($q.platform.is.electron) {
    ipcRenderer.on('show-settings', () => {
      router.push('/settings')
    })
  }

})

// window.addEventListener('contextmenu', e => {
//   e.preventDefault()
// })
</script>