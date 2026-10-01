# Academic Calendar PWA — fixed JSONP version

1. In Apps Script replace Code.gs with the supplied Code.gs.
2. Deploy/update the Web App. Use the `/exec` URL.
3. In app.js replace PASTE_YOUR_APPS_SCRIPT_WEB_APP_URL_HERE with that URL.
4. Upload index.html, style.css, app.js, manifest.json, sw.js and icons/ to GitHub Pages.
5. Clear the old service worker/site data once before testing the new version.

This version uses JSONP GET requests for reading and writing so the GitHub Pages frontend does not make CORS fetch requests to Apps Script.
