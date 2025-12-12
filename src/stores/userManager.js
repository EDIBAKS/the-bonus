import { defineStore } from 'pinia';
import { supabase } from 'src/boot/supabase';
import { ref, onMounted } from 'vue';
import { useShowErrorMessage } from 'src/use/useShowErrorMessage';

export const useUserManager = defineStore('userManager', () => {
  const users = ref([]);
  const departments = ref([]);
  const roles = ref([]); // Store roles
  const loading = ref(false);

  // Fetch departments from Supabase
  const fetchDepartments = async () => {
    try {
      const { data, error } = await supabase.from('departments').select('name');
      if (error) throw error;
      departments.value = data.map(d => d.name); // Store only names
    } catch (error) {
      useShowErrorMessage(error.message);
    }
  };

  // Fetch roles from Supabase (if stored in a roles table)
  const fetchRoles = async () => {
    try {
      const { data, error } = await supabase.from('roles').select('name');
      if (error) throw error;
      roles.value = data.map(r => r.name); // Store only names
    } catch (error) {
      useShowErrorMessage(error.message);
    }
  };

  // Fetch users from Supabase
  const fetchUsers1 = async () => {
    loading.value = true;
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, email, username, names, telephone, role, department, LastLogin, LastLogOut');
      if (error) throw error;
      users.value = data || [];
    } catch (error) {
      useShowErrorMessage(error.message);
    } finally {
      loading.value = false;
    }
  };

  const fetchUsers2 = async () => {
    loading.value = true;
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, email, username, names, telephone, role, department, LastLogin, LastLogOut');
  
      if (error) throw error;
  
      // Convert LastLogin and LastLogOut to local time
      users.value = data.map(user => ({
        ...user,
        LastLogin: user.LastLogin ? new Date(user.LastLogin).toLocaleString() : null,
        LastLogOut: user.LastLogOut ? new Date(user.LastLogOut).toLocaleString() : null
      }));
  
    } catch (error) {
      useShowErrorMessage(error.message);
    } finally {
      loading.value = false;
    }
  };

  const fetchUsers = async () => {
    loading.value = true;
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, email, username, names, telephone, role, department, LastLogin, LastLogOut');
  
      if (error) throw error;
  
      users.value = data.map(user => ({
        ...user,
        LastLogin: user.LastLogin ? new Date(user.LastLogin).toLocaleString() : null,
        LastLogOut: user.LastLogOut ? new Date(user.LastLogOut).toLocaleString() : null
      }));
  
    } catch (error) {
      useShowErrorMessage(error.message);
    } finally {
      loading.value = false;
    }
  };
  
  

  // Register a new user
  const registerUser = async (userData) => {
    const { email, password, names, username, telephone, role, department } = userData;
    try {
      let { data, error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;

      if (data?.user) {
        const { error: userError } = await supabase.from('users').insert([
          { id: data.user.id, names, username, telephone, role, department, email }
        ]);
        if (userError) throw userError;

        await fetchUsers(); // Update user list
      }
    } catch (error) {
      useShowErrorMessage(error.message);
    }
  };

  // Delete a user
  const deleteUser = async (userId) => {
    try {
      const { error } = await supabase.from('users').delete().eq('id', userId);
      if (error) throw error;
      users.value = users.value.filter(user => user.id !== userId); // Remove from UI
    } catch (error) {
      useShowErrorMessage(error.message);
    }
  };

  // Load data on mount
  onMounted(() => {
    fetchUsers();
    fetchDepartments();
    fetchRoles();
    
    
  });

  return {
    users,
    departments,
    roles,
    loading,
    fetchUsers,
    registerUser,
    deleteUser,
  };
});
