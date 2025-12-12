<template>
  <q-page  class="auth-page flex flex-center q-pa-sm"
  :style="`background-image: url(${loginBg}); background-size: cover; background-position: center;`">
    <q-card
      class="auth bg-transparent text-white q-pa-lg"
      style="width: 450px;"
      flat
  bordered
    >
      <q-card-section>
        <ToolbarTitle />
      </q-card-section>
      <q-card-section>
        <q-tabs
          v-model="tab"
          no-caps
        >
          <q-tab class="text-primary" name="login" label="Login" />
          <!--
          <q-tab name="register" label="Register" />
          -->
        </q-tabs>
      </q-card-section>
      <q-card-section>
        <q-form
          @submit="formSubmit"
        >
        <q-input
         outlined
           v-model="credentials.email"
          
          class="q-mb-md"
            :bg-color="useLightOrDark('transparent', 'black')"
            label="Email"
            :label-color="useLightOrDark('primary', 'white')"
            type="email"
            autocomplete="email" 
          />
          <!--
          <q-input
          outlined
            v-model="credentials.email"
            class="q-mb-md"
            :bg-color="useLightOrDark('transparent', 'black')"
            label="Email"
            label-color="black"
            type="email"
            autocomplete="email"
            filled
          />
          -->
          <q-input
           outlined
            
            v-model="credentials.password"
            class="q-mb-md"
            :bg-color="useLightOrDark('transparent', 'black')"
            label="Password"
            :label-color="useLightOrDark('primary', 'white')"
            type="password"
            autocomplete="current-password"
            
            />

            <!--
          <q-input
            v-model="credentials.password"
            class="q-mb-md"
            :bg-color="useLightOrDark('transparent', 'black')"
            label="Password"
            label-color="black"
            type="password"
            autocomplete="current-password"
            filled
          />
          -->
          <!--
          <div v-if="tab === 'register'">

            <q-input
            v-model="credentials.username"
            class="q-mb-md"
            :bg-color="useLightOrDark('white', 'black')"
            label="Username"
            
            
            filled
          />
          <q-input
            v-model="credentials.names"
            class="q-mb-md"
            :bg-color="useLightOrDark('white', 'black')"
            label="Names"
           
           
            filled
          />
          <q-input
            v-model="credentials.telephone"
            class="q-mb-md"
            :bg-color="useLightOrDark('white', 'black')"
            label="Telephone"
            filled
          />
          <q-select
           filled
           class="q-mb-md"
            v-model="credentials.role"
            :bg-color="useLightOrDark('white', 'black')"
            
            option-label="title"
             option-value="title"
              label="Role"
              emit-value
              map-options 
              />
             
              <q-select
               filled
               class="q-mb-md"
                v-model="credentials.department"
               :bg-color="useLightOrDark('white', 'black')"
               
                option-label="name"
                option-value="name"
                 label="Department"
                 emit-value
                 map-options 
                  />

          </div>
-->
          <q-btn
            class="full-width"
          color="primary"
            type="submit"
            
            :label="submitButtonTitle"
            no-caps
          />
        </q-form>
      </q-card-section>


</q-card>
  </q-page>
</template>
<script setup>
import { ref,reactive,computed } from 'vue';
import { useQuasar } from 'quasar';
//import { useRouter } from 'vue-router';
import ToolbarTitle from 'src/components/ToolbarTitle.vue';
import { useLightOrDark } from 'src/use/useLightOrDark';
import { useStoreAuth } from 'src/stores/storeAuth';
import loginBg from '../assets/finance.jpg'
const storeAuth=useStoreAuth()
const tab=ref('login')
const $q=useQuasar()
//const router=useRouter()
const credentials = reactive({
      email: '',
      password: '',
      names:'',
      username:'',
      telephone:'',
      role:'',
      department:''
    })
    const submitButtonTitle = computed(() => {
      return tab.value === 'login' ? 'Login' : 'Register'
    })
    const formSubmit = () => {
      if (!credentials.email || !credentials.password) {
        $q.dialog({
          title: 'Error',
          message: 'Please enter an email & password motherflipper!'
        })
      }
      else {
        formSubmitSuccess()
      }
    }
const formSubmitSuccess=()=>{
  if(tab.value ==='register'){
storeAuth.registerUser(credentials)
  }else{
    storeAuth.loginUser(credentials)
    
  }
 
}
</script>

<style scoped>
.auth-page {
  background-image: url('https://your-image-url.com/image.jpg');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  min-height: 100vh;
}
</style>
