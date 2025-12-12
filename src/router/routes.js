const routes = [
  {
     path: '/',
     component: () => import('layouts/MainLayout.vue'),
     
     children: [
      { path: '', component: () => import('pages/BonusPage.vue') }, // Default page
       { path: '/settings', component: () => import('pages/PageSettings.vue') },
       { path: '/users', component: () => import('pages/PageUserManager.vue') },
       { path: '/reports', component: () => import('pages/ReportsPage.vue') },
    
     ]
   },
   {
     path: '/auth',
     component: () => import('layouts/AuthLayout.vue'),
     children: [
       { path: '', component: () => import('pages/PageAuth.vue')}
     ]
   },
   {
     path: '/:catchAll(.*)*',
     component: () => import('pages/ErrorNotFound.vue')
   }
 ]
 
 export default routes
 