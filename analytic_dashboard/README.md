# Analytics Dashboard

This folder contains a small client-side analytics dashboard used for development and demos.

Files
- `index.html` — dashboard UI that loads `app.js` and `styles.css`.
- `app.js` — Chart.js setup, a simulation updater, and polling helpers to wire real APIs.
- `mock_data.json` — sample payload the dashboard can fetch and display.

Mock data
 - The dashboard can fetch `mock_data.json` as a default test payload. Serve the folder with a static server (or host via your dev server) so `fetch('./mock_data.json')` works.

Wiring real APIs
 - `app.js` exposes a global `window.analyticsPolling` with methods:
   - `configure({ url, interval, fetchOptions })` — update polling settings.
   - `start()` — begin polling the configured `url` at `interval` ms.
   - `stop()` — stop polling.
   - `fetchOnce(url)` — fetch once and apply the response.

 - The expected JSON payload shape matches `mock_data.json`:
```
{
  "facebook": number,
  "website": number,
  "other": number,
  "types": {
    "functionRoom": { "facebook": number, "website": number },
    "delivery": { "facebook": number, "website": number },
    "catering": { "facebook": number, "website": number }
  },
  "inquiries": { "new": number, "resolved": number }
}
```

Notes
- Polling is NOT started automatically; call `analyticsPolling.start()` from the console or your app when you're ready. The dashboard also runs an internal simulation updater (5s) so you'll see activity while developing.
