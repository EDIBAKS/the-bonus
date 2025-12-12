import { boot } from 'quasar/wrappers'
import { useStoreAuth } from 'src/stores/storeAuth'
export default boot(({ router}) => {
  const storeAuth=useStoreAuth()
  router.beforeEach((to, from) => {
    if(!storeAuth.userDetails.id && to.path !== '/auth'){
      return '/auth'
    }
    if(storeAuth.userDetails.id && to.path === '/auth'){
       return false
    }
  })
})