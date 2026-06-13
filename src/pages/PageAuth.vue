<template>
  <q-page class="row full-height bg-white">

    <!-- LEFT SIDE -->
   <!-- LEFT SIDE -->
<div class="col-12 col-md-6 flex column justify-center q-pa-xl">

  <!-- Logo -->
  <div class="text-center q-mb-md">
    <img
      src="../assets/dynabonuslogo.png"
      alt="DynaBonus"
      style="width:250px;"
    />
  </div>

  <!-- Hero Text -->
  <div class="text-center">

    <div
      class="text-weight-bold"
      style="
        font-size: 4rem;
        line-height: 1.1;
      "
    >
      <span class="text-red">Manage</span>
      <span class="text-grey-8"> Payments</span>
      <br />
      <span class="text-grey-8">in One Click</span>
    </div>

    <p
      class="text-grey-7 q-mt-lg"
      style="
        font-size: 1.2rem;
        max-width: 550px;
        margin-left:auto;
        margin-right:auto;
      "
    >
      Automate bonus payments, monitor distributor rewards,
      and generate consolidated reports.
    </p>

  </div>

  <!-- Footer -->
  <div class="text-center text-grey-6 q-mt-xl">
    © AlvinConcepts
  </div>

</div>

    <!-- RIGHT SIDE -->
    <div
      class="col-12 col-md-6 flex flex-center bg-grey-1"
    >
      <q-card
        class="q-pa-xl"
        style="
          width: 420px;
          border-radius: 16px;
        "
        flat
        bordered
      >

        <q-card-section>
          <div class="text-h5 text-weight-bold">
            Welcome Back
          </div>

          <div class="text-grey-6">
            Sign in to your account
          </div>
        </q-card-section>

        <q-card-section>

          <q-form @submit="formSubmit">

            <q-input
              outlined
              v-model="credentials.email"
              label="Email"
              type="email"
              class="q-mb-md"
            />

            <q-input
              outlined
              v-model="credentials.password"
              label="Password"
              type="password"
              class="q-mb-lg"
            />

            <q-btn
              type="submit"
              color="primary"
              class="full-width"
              label="Login"
              no-caps
            />

          </q-form>

        </q-card-section>

      </q-card>
    </div>

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
