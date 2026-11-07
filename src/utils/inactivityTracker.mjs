export function createInactivityTracker({
  window,
  document,
  storage,
  userId,
  limit,
  warningDuration,
  onWarning,
  onExpire,
  now = () => Date.now(),
  setTimer = setTimeout,
  clearTimer = clearTimeout,
}) {
  const storageKey = 'bonusLastActivity';
  const events = ['mousemove', 'keydown', 'touchstart', 'click', 'scroll', 'wheel'];
  let lastActivity = 0;
  let lastWrite = 0;
  let timer;
  let active = false;

  function readActivity() {
    try {
      const value = JSON.parse(storage.getItem(storageKey));
      return value?.userId === userId && Number.isFinite(value.time) && value.time <= now()
        ? value.time
        : 0;
    } catch (error) {
      console.error('Unable to read inactivity timestamp:', error);
      return 0;
    }
  }

  function writeActivity() {
    try {
      storage.setItem(storageKey, JSON.stringify({ userId, time: lastActivity }));
      lastWrite = lastActivity;
    } catch (error) {
      console.error('Unable to save inactivity timestamp:', error);
    }
  }

  function check() {
    if (!active) return false;
    lastActivity = Math.max(lastActivity, readActivity());
    const remaining = limit - (now() - lastActivity);
    if (remaining <= 0) {
      stop();
      onExpire();
      return false;
    }
    const warning = remaining <= warningDuration;
    onWarning(warning ? Math.ceil(remaining / 1000) : 0);
    clearTimer(timer);
    timer = setTimer(check, warning ? Math.min(1000, remaining) : remaining - warningDuration);
    return true;
  }

  function onActivity(event) {
    if (!check()) {
      if (event.cancelable) event.preventDefault();
      event.stopImmediatePropagation();
      return;
    }
    lastActivity = now();
    if (lastActivity - lastWrite >= 1000) writeActivity();
    check();
  }

  function onStorage(event) {
    if (event.key === storageKey) check();
  }

  function start(reset = false) {
    if (active) return;
    active = true;
    lastActivity = reset ? now() : readActivity() || now();
    if (reset || !readActivity()) writeActivity();
    events.forEach((event) => window.addEventListener(event, onActivity, { capture: true }));
    window.addEventListener('focus', check);
    window.addEventListener('pageshow', check);
    window.addEventListener('storage', onStorage);
    document.addEventListener('visibilitychange', check);
    check();
  }

  function stop() {
    if (!active) return;
    active = false;
    clearTimer(timer);
    events.forEach((event) => window.removeEventListener(event, onActivity, { capture: true }));
    window.removeEventListener('focus', check);
    window.removeEventListener('pageshow', check);
    window.removeEventListener('storage', onStorage);
    document.removeEventListener('visibilitychange', check);
    onWarning(0);
  }

  return { start, stop, check };
}
