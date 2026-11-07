import { boot } from 'quasar/wrappers'
import { useStoreAuth } from 'src/stores/storeAuth'

export default boot(async ({ router }) => {
  const storeAuth = useStoreAuth()
  await storeAuth.init(router)
  router.beforeEach((to) => {
    if (!storeAuth.isAuthenticated && to.path !== '/auth') return '/auth'
    if (storeAuth.isAuthenticated && to.path === '/auth') return '/'
  })
})