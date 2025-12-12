<template>
  <q-page class="q-pa-md">
    <q-tabs v-model="tab" dense class="text-primary">
      <q-tab name="newUser" label="New User" />
      <q-tab name="manageUsers" label="Manage Users" />
    </q-tabs>

    <q-tab-panels v-model="tab" animated>
      <!-- New User Form -->
      <q-tab-panel name="newUser">
        <q-form @submit="handleRegister">
          <q-input v-model="form.email" label="Email" type="email" required />
          <q-input v-model="form.password" label="Password" type="password" required />
          <q-input v-model="form.confirmPassword" label="Confirm Password" type="password" required />

          <q-input v-model="form.username" label="Username" required />
          <q-input v-model="form.names" label="Full Name" required />
          <q-input v-model="form.telephone" label="Telephone" type="tel" required />

          <q-select v-model="form.role" :options="userManager.roles" label="User Role" emit-value map-options required />
          <q-select v-model="form.department" :options="userManager.departments" label="Department" emit-value map-options required />


          <q-btn label="Register User" type="submit" color="primary" class="q-mt-md" />
        </q-form>
      </q-tab-panel>

      <!-- Manage Users List -->
      <q-tab-panel name="manageUsers">
        <q-table :rows="users" :columns="columns" row-key="id" :loading="loading">
          <template v-slot:body-cell-actions="props">
            <q-td>
              <q-btn @click="deleteUser(props.row.id)" color="negative" icon="delete" flat round />
            </q-td>
          </template>
        </q-table>
      </q-tab-panel>
    </q-tab-panels>
  </q-page>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useUserManager } from 'src/stores/userManager';
import { useShowErrorMessage } from 'src/use/useShowErrorMessage';

const tab = ref('newUser');
const userManager = useUserManager();

const users = computed(() => userManager.users);
const departments = computed(() => 
  userManager.departments.map(d => ({ label: d.name, value: d.name }))
);
const roles=computed(() => userManager.roles.map(d => ({ label: d.name, value: d.name })));
const loading = computed(() => userManager.loading);

const form = ref({
  email: '',
  password: '',
  confirmPassword: '',
  username: '',
  names: '',
  telephone: '',
  role: '',
  department: ''
});



const columns = [
  { name: 'email', label: 'Email', field: 'email', align: 'left' },
  { name: 'username', label: 'Username', field: 'username', align: 'left' },
  { name: 'role', label: 'role', field: 'role', align: 'left' },
  { name: 'lastLogin', label: 'Last Login', field: 'LastLogin', align: 'left' },
  { name: 'lastLogout', label: 'Last Logout', field: 'LastLogOut', align: 'left' },
  { name: 'actions', label: 'Actions', align: 'center' }
];

const handleRegister = () => {
  if (form.value.password !== form.value.confirmPassword) {
    useShowErrorMessage('Passwords do not match');
    return;
  }

  userManager.registerUser(form.value);
  form.value = { email: '', password: '', confirmPassword: '', username: '', names: '', telephone: '', role: '', department: '' };
};

const deleteUser = (userId) => {
  if (confirm('Are you sure you want to delete this user? Once deleted, they will not be able to log in again.')) {
    userManager.deleteUser(userId);
    alert('User deleted successfully. They can no longer log in.');
  }
};

</script>
