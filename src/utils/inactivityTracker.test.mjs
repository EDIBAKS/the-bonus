import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createInactivityTracker } from './inactivityTracker.mjs';

function fixture(initialTime = 100000) {
  let time = initialTime;
  let nextTimer = 0;
  const timers = new Map();
  const values = new Map();
  const warnings = [];
  let expired = 0;
  const target = () => {
    const listeners = new Map();
    return {
      listeners,
      addEventListener(name, callback) { listeners.set(name, callback); },
      removeEventListener(name, callback) {
        if (listeners.get(name) === callback) listeners.delete(name);
      },
      emit(name, event = {}) { listeners.get(name)?.(event); },
    };
  };
  const window = target();
  const document = target();
  const storage = {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
  };
  const tracker = createInactivityTracker({
    window, document, storage, userId: 'user', limit: 5000, warningDuration: 2000,
    now: () => time,
    setTimer(callback, delay) {
      const id = ++nextTimer;
      timers.set(id, { callback, at: time + delay });
      return id;
    },
    clearTimer(id) { timers.delete(id); },
    onWarning: (seconds) => warnings.push(seconds),
    onExpire: () => { expired += 1; },
  });
  return {
    tracker, window, document, storage, warnings,
    expired: () => expired,
    advance(ms, run = true) {
      const end = time + ms;
      while (run) {
        const next = [...timers.entries()].sort((a, b) => a[1].at - b[1].at)[0];
        if (!next || next[1].at > end) break;
        time = next[1].at;
        timers.delete(next[0]);
        next[1].callback();
      }
      time = end;
    },
  };
}

test('warning counts down and activity starts a fresh inactivity period', () => {
  const f = fixture();
  f.tracker.start();
  f.advance(3000);
  assert.equal(f.warnings.at(-1), 2);
  f.advance(1000);
  assert.equal(f.warnings.at(-1), 1);
  f.window.emit('mousemove');
  assert.equal(f.warnings.at(-1), 0);
  f.advance(4999);
  assert.equal(f.expired(), 0);
  f.advance(1);
  assert.equal(f.expired(), 1);
  assert.equal(f.window.listeners.size, 0);
  assert.equal(f.document.listeners.size, 0);
});

test('expired activity is blocked when background timers were delayed', () => {
  const f = fixture();
  f.tracker.start();
  f.advance(6000, false);
  let prevented = false;
  let stopped = false;
  f.window.emit('click', {
    cancelable: true,
    preventDefault() { prevented = true; },
    stopImmediatePropagation() { stopped = true; },
  });
  assert.equal(f.expired(), 1);
  assert.equal(prevented, true);
  assert.equal(stopped, true);
});

test('restores persisted inactivity and respects activity in another tab', () => {
  const f = fixture();
  f.storage.setItem('bonusLastActivity', JSON.stringify({ userId: 'user', time: 98000 }));
  f.tracker.start();
  f.advance(1000);
  assert.equal(f.warnings.at(-1), 2);
  f.storage.setItem('bonusLastActivity', JSON.stringify({ userId: 'user', time: 101000 }));
  f.window.emit('storage', { key: 'bonusLastActivity' });
  assert.equal(f.warnings.at(-1), 0);
  f.advance(4999);
  assert.equal(f.expired(), 0);
  f.advance(1);
  assert.equal(f.expired(), 1);
});

test('expired restored session logs out immediately; a fresh sign-in resets it', () => {
  const f = fixture();
  f.storage.setItem('bonusLastActivity', JSON.stringify({ userId: 'user', time: 90000 }));
  f.tracker.start();
  assert.equal(f.expired(), 1);

  const fresh = fixture();
  fresh.storage.setItem('bonusLastActivity', JSON.stringify({ userId: 'user', time: 90000 }));
  fresh.tracker.start(true);
  assert.equal(fresh.expired(), 0);
  fresh.advance(5000);
  assert.equal(fresh.expired(), 1);
});
