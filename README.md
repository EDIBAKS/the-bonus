# Quasar App (bonus-app)

A Quasar Project

## Install the dependencies
```bash
yarn
# or
npm install
```

### Start the app in development mode (hot-code reloading, error reporting, etc.)
```bash
quasar dev
```


### Build the app for production
```bash
quasar build
```

### Session inactivity
Authenticated sessions expire after five minutes without activity. A countdown appears
for the final minute; mouse, keyboard, touch, click, and scroll activity resets it.
Activity is shared between tabs in the same browser. After expiry the app returns to
the login screen even if the sign-out request fails.

The unpaid members report listens for changes to the Supabase `Bonus` table. Enable
that table in the `supabase_realtime` publication and allow the signed-in users to
receive its changes for immediate updates. The report also refreshes on focus and
every minute while open.

The unpaid members report shows paid and owed grand totals for the currently
filtered members. Its Excel and landscape PDF exports include those totals and
preserve the current member search, DPC scope, currency, and table sort order.
The floating arrow on the bonus and reports pages returns to the top after scrolling down.

Run the inactivity and authentication tests with:
```bash
node --experimental-vm-modules --test src/stores/storeAuth.test.mjs src/utils/inactivityTracker.test.mjs
```

### Customize the configuration
See [Configuring quasar.config.js](https://v2.quasar.dev/quasar-cli-vite/quasar-config-js).
