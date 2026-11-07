import { defineStore } from 'pinia';
import { reactive, ref } from 'vue';
import { supabase } from 'src/boot/supabase';
import { useShowErrorMessage } from 'src/use/useShowErrorMessage';
import { createInactivityTracker } from 'src/utils/inactivityTracker.mjs';
import { useBonusStore } from './bonusStore';

const INACTIVITY_LIMIT = 5 * 60 * 1000;
const WARNING_DURATION = 60 * 1000;

export const useStoreAuth = defineStore('auth', () => {
  const userDetailsDefault = {
    id: null, email: null, names: null, username: null,
    telephone: null, role: null, department: null,
  };
  const userDetails = reactive({ ...userDetailsDefault });
  const isAuthenticated = ref(false);
  const inactivitySeconds = ref(0);
  let router;
  let tracker;
  let initialization;
  let sessionVersion = 0;
  let pendingSession;
  let pendingSessionId;
  let logoutPromise;
  let registrationInProgress = false;
  const signedOutKey = 'bonusSignedOutUser';

  const clearSession = () => {
    sessionVersion += 1;
    pendingSession = null;
    pendingSessionId = null;
    isAuthenticated.value = false;
    tracker?.stop();
    tracker = null;
    Object.assign(userDetails, userDetailsDefault);
    localStorage.removeItem('userDetails');
    const bonusStore = useBonusStore();
    bonusStore.unsubscribeFromBonuses();
    bonusStore.unsubscribeFromTodayPaidBonuses();
    bonusStore.bonuses = [];
    bonusStore.dpcNames = [];
    bonusStore.todayPaidBonuses = [];
  };

  const goToLogin = () => {
    if (router && router.currentRoute.value.path !== '/auth') {
      router.replace('/auth').catch((error) => console.error('Unable to open login page:', error));
    }
  };

  const fetchUserDetails = async (userId) => {
    const { data, error } = await supabase.from('users').select('*').eq('id', userId).single();
    if (error) throw error;
    return data;
  };

  const establishSession = (session, resetActivity = false) => {
    if (isAuthenticated.value && userDetails.id === session.user.id) return Promise.resolve();
    if (pendingSession && pendingSessionId === session.user.id) return pendingSession;

    const version = ++sessionVersion;
    pendingSessionId = session.user.id;
    pendingSession = (async () => {
      try {
        const details = await fetchUserDetails(session.user.id);
        if (version !== sessionVersion) return;
        Object.assign(userDetails, details, { id: session.user.id, email: session.user.email });
        tracker?.stop();
        tracker = createInactivityTracker({
          window,
          document,
          storage: localStorage,
          userId: session.user.id,
          limit: INACTIVITY_LIMIT,
          warningDuration: WARNING_DURATION,
          onWarning: (seconds) => { inactivitySeconds.value = seconds; },
          onExpire: () => { void logoutUser(); },
        });
        isAuthenticated.value = true;
        tracker.start(resetActivity);
        if (!isAuthenticated.value) return;
        localStorage.setItem('userDetails', JSON.stringify(userDetails));
        if (router?.currentRoute.value.path === '/auth') await router.replace('/');
      } catch (error) {
        if (version !== sessionVersion) return;
        console.error('Unable to initialize user session:', error);
        useShowErrorMessage('Unable to load your account. Please sign in again.');
        await logoutUser();
      } finally {
        if (version === sessionVersion) {
          pendingSession = null;
          pendingSessionId = null;
        }
      }
    })();
    return pendingSession;
  };

  const logoutUser = () => {
    if (logoutPromise) return logoutPromise;
    const userId = userDetails.id;
    if (userId) localStorage.setItem(signedOutKey, userId);
    clearSession();
    goToLogin();
    logoutPromise = (async () => {
      const update = userId
        ? supabase.from('users').update({ LastLogOut: new Date().toISOString() }).eq('id', userId)
        : null;
      try {
        const updatePromise = update ? Promise.resolve(update) : Promise.resolve(null);
        const { error } = await supabase.auth.signOut();
        if (error && error.message !== 'Auth session missing') {
          console.error('Unable to sign out:', error);
          useShowErrorMessage('Unable to complete sign out. Please check your connection.');
        }
        const result = await updatePromise;
        if (result?.error) console.error('Unable to record logout time:', result.error);
      } catch (error) {
        console.error('Unable to complete sign out:', error);
        useShowErrorMessage('Unable to complete sign out. Please check your connection.');
      } finally {
        logoutPromise = null;
      }
    })();
    return logoutPromise;
  };

  const init = (appRouter) => {
    if (initialization) return initialization;
    router = appRouter;
    window.addEventListener('storage', (event) => {
      if (event.key === signedOutKey && event.newValue
        && (event.newValue === userDetails.id || event.newValue === pendingSessionId)) {
        clearSession();
        goToLogin();
      }
    });
    supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || (event === 'INITIAL_SESSION' && !session)) {
        clearSession();
        setTimeout(() => {
          if (!isAuthenticated.value && !pendingSession) goToLogin();
        }, 0);
      } else if (event === 'SIGNED_IN' && session?.user && !logoutPromise && !registrationInProgress) {
        const version = sessionVersion;
        setTimeout(() => {
          if (!logoutPromise && version === sessionVersion
            && localStorage.getItem(signedOutKey) !== session.user.id) {
            void establishSession(session, false);
          }
        }, 0);
      }
    });
    initialization = (async () => {
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        console.error('Unable to restore session:', error);
        useShowErrorMessage('Unable to restore your session. Please sign in again.');
        clearSession();
        return;
      }
      if (data.session?.user && localStorage.getItem(signedOutKey) === data.session.user.id) {
        void logoutUser();
      } else if (data.session?.user) await establishSession(data.session);
      else clearSession();
    })();
    return initialization;
  };

  const loginUser = async ({ email, password }) => {
    if (logoutPromise) await logoutPromise;
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      useShowErrorMessage(error.message);
      return;
    }
    if (data?.session) {
      localStorage.removeItem(signedOutKey);
      await establishSession(data.session, true);
      if (isAuthenticated.value) {
        const { error: updateError } = await supabase.from('users')
          .update({ LastLogin: new Date().toISOString() }).eq('id', data.user.id);
        if (updateError) console.error('Unable to record login time:', updateError);
      }
    }
  };

  const registerUser = async ({ email, password, names, username, telephone, role, department }) => {
    registrationInProgress = true;
    try {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) {
        useShowErrorMessage(error.message);
        return;
      }
      if (data?.user) {
        const { error: userError } = await supabase.from('users').insert([
          { id: data.user.id, names, username, telephone, role, department, email },
        ]);
        if (userError) {
          useShowErrorMessage(userError.message);
          if (data.session) await logoutUser();
        } else if (data.session) {
          localStorage.removeItem(signedOutKey);
          await establishSession(data.session, true);
        }
      }
    } finally {
      registrationInProgress = false;
    }
  };

  return { userDetails, isAuthenticated, inactivitySeconds, init, registerUser, loginUser, logoutUser };
});
