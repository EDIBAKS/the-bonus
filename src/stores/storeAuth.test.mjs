import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { SourceTextModule, SyntheticModule } from 'node:vm';

async function fixture({ session = null, signOutError = null } = {}) {
  const values = new Map();
  const handlers = new Map();
  const localStorage = {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: (key) => values.delete(key),
  };
  const window = {
    addEventListener: (name, fn) => handlers.set(name, fn),
  };
  const router = {
    currentRoute: { value: { path: '/reports' } },
    async replace(path) { this.currentRoute.value.path = path; },
  };
  let authListener;
  let signOutCalls = 0;
  const user = { id: 'user-1', email: 'user@example.test' };
  const query = {
    select() { return this; },
    eq() { return this; },
    update() { return this; },
    async single() { return { data: { id: user.id, username: 'Test' }, error: null }; },
    then(resolve) { return Promise.resolve({ error: null }).then(resolve); },
  };
  const supabase = {
    from: () => query,
    auth: {
      onAuthStateChange(callback) { authListener = callback; },
      async getSession() { return { data: { session }, error: null }; },
      async signOut() {
        signOutCalls += 1;
        if (signOutError) return { error: signOutError };
        session = null;
        authListener('SIGNED_OUT', null);
        return { error: null };
      },
      async signInWithPassword() {
        session = { user };
        authListener('SIGNED_IN', session);
        return { data: { session, user }, error: null };
      },
    },
  };
  const bonusStore = {
    unsubscribeFromBonuses() {},
    unsubscribeFromTodayPaidBonuses() {},
  };
  const trackerState = { options: null, stopped: false };
  const dependencies = {
    pinia: { defineStore: (_name, setup) => setup },
    vue: { reactive: (value) => value, ref: (value) => ({ value }) },
    'src/boot/supabase': { supabase },
    'src/use/useShowErrorMessage': { useShowErrorMessage() {} },
    'src/utils/inactivityTracker.mjs': {
      createInactivityTracker(options) {
        trackerState.options = options;
        return { start() {}, stop() { trackerState.stopped = true; } };
      },
    },
    './bonusStore': { useBonusStore: () => bonusStore },
  };
  const source = await readFile(new URL('./storeAuth.js', import.meta.url), 'utf8');
  const module = new SourceTextModule(source, {
    initializeImportMeta(meta) { meta.url = import.meta.url; },
  });
  const previousWindow = globalThis.window;
  const previousDocument = globalThis.document;
  const previousStorage = globalThis.localStorage;
  globalThis.window = window;
  globalThis.document = {};
  globalThis.localStorage = localStorage;
  await module.link((specifier) => {
    const exports = dependencies[specifier];
    return new SyntheticModule(Object.keys(exports), function () {
      for (const [name, value] of Object.entries(exports)) this.setExport(name, value);
    });
  });
  await module.evaluate();
  const store = module.namespace.useStoreAuth();
  return {
    store, router, localStorage, handlers, trackerState,
    signOutCalls: () => signOutCalls,
    restore() {
      globalThis.window = previousWindow;
      globalThis.document = previousDocument;
      globalThis.localStorage = previousStorage;
    },
  };
}

test('expiry immediately locks the page and redirects even if sign out fails', async () => {
  const f = await fixture({
    session: { user: { id: 'user-1', email: 'user@example.test' } },
    signOutError: { message: 'Network error' },
  });
  try {
    await f.store.init(f.router);
    assert.equal(f.store.isAuthenticated.value, true);
    f.trackerState.options.onExpire();
    assert.equal(f.store.isAuthenticated.value, false);
    assert.equal(f.router.currentRoute.value.path, '/auth');
    assert.equal(f.localStorage.getItem('bonusSignedOutUser'), 'user-1');
    assert.equal(f.trackerState.stopped, true);
    await f.store.logoutUser();
    assert.equal(f.signOutCalls(), 1);
  } finally {
    f.restore();
  }
});

test('remote sign out locks an active page and a fresh login starts a session', async () => {
  const f = await fixture({ session: { user: { id: 'user-1', email: 'user@example.test' } } });
  try {
    await f.store.init(f.router);
    f.handlers.get('storage')({ key: 'bonusSignedOutUser', newValue: 'user-1' });
    assert.equal(f.store.isAuthenticated.value, false);
    assert.equal(f.router.currentRoute.value.path, '/auth');
    await f.store.loginUser({ email: 'user@example.test', password: 'test' });
    assert.equal(f.store.isAuthenticated.value, true);
    assert.equal(f.router.currentRoute.value.path, '/');
    await f.store.logoutUser();
  } finally {
    f.restore();
  }
});
