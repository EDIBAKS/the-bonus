<template>
    <q-page class="flex flex-center">
      <q-card class="q-pa-md" style="width: 400px">
        <q-card-section>
          <div class="text-h6 text-center">{{ isSignUp ? 'Sign Up' : 'Login' }}</div>
        </q-card-section>
  
        <q-card-section>
          <q-input v-model="email" label="Email" type="email" outlined />
          <q-input v-model="password" label="Password" type="password" outlined class="q-mt-md" />
  
          <!-- Show extra fields only during Signup -->
          <div v-if="isSignUp">
            <q-input v-model="userName" label="User Name" outlined class="q-mt-md" />
            <q-input v-model="phone" label="Phone Number" type="tel" outlined class="q-mt-md" />
            <q-input v-model="branch" label="Branch" outlined class="q-mt-md" />
          </div>
        </q-card-section>
  
        <q-card-section class="q-gutter-sm">
          <q-btn 
            :label="isSignUp ? 'Sign Up' : 'Login'" 
            color="primary" 
            @click="isSignUp ? register() : login()" 
            class="full-width" 
          />
          <q-btn 
            :label="isSignUp ? 'Already have an account? Login' : 'New user? Sign Up'" 
            color="secondary" 
            flat class="full-width" 
            @click="isSignUp = !isSignUp" 
          />
        </q-card-section>
      </q-card>
    </q-page>
  </template>
  
  <script setup>
  import { ref } from 'vue';
  import { supabase } from '../boot/supabase'; // Import your Supabase instance
  import { useRouter } from 'vue-router';
  

  const isSignUp = ref(false);
  const email = ref('');
  const password = ref('');
  const userName = ref('');
  const phone = ref('');
  const branch = ref('');
  const router = useRouter();
  // Login Function
  const login = async () => {
    const { error } = await supabase.auth.signInWithPassword({
      email: email.value,
      password: password.value
    });
  
    if (error) {
      alert(error.message);
    } else {
      alert('Login successful!');
      router.push('/'); // Redirect after login

    }
  };
  
  // Signup Function
  const register = async () => {
  try {
    console.log('Registering user with email:', email.value);

    // Step 1: Sign up user with email & password
    const { data, error } = await supabase.auth.signUp({
      email: email.value,
      password: password.value
    });

    if (error) {
      console.error('Signup error:', error.message);
      alert(`Signup failed: ${error.message}`);
      return;
    }

    if (!data || !data.user) {
      console.error('No user data returned from Supabase after signup.');
      alert('Signup failed. Please try again.');
      return;
    }

    console.log('User created:', data.user);

    alert('Check your email for verification!');

    // Step 2: Save additional user details in the "profiles" table
    const userId = data.user.id;
    console.log('Inserting user profile data for user ID:', userId);

    const { error: profileError } = await supabase
      .from('profiles')
      .insert([
        {
          id: userId,
          display_name: userName.value,
          phone: phone.value,
          branch: branch.value
        }
      ]);

    if (profileError) {
      console.error('Error saving profile:', profileError.message);
      alert(`Profile save error: ${profileError.message}`);
    } else {
      console.log('Profile saved successfully!');
      alert('User profile saved successfully!');
    }
  } catch (err) {
    console.error('Unexpected error:', err);
    alert('An unexpected error occurred.');
  }
};


  </script>
  