# Academic Calendar PWA

## Files

- `index.html` — app interface
- `style.css` — mobile/calendar styling
- `app.js` — calendar logic and Apps Script connection
- `manifest.json` — installable PWA configuration
- `sw.js` — offline app shell
- `Code.gs` — Google Apps Script backend
- `icons/` — app icons

## Important

Before publishing the PWA:

1. Deploy `Code.gs` as an Apps Script Web App.
2. Copy its `/exec` URL.
3. Open `app.js`.
4. Replace:
   `PASTE_YOUR_APPS_SCRIPT_WEB_APP_URL_HERE`
   with your real `/exec` URL.
5. Upload the PWA files to GitHub Pages.

The calendar data remains in the Google Sheet used by the Apps Script project.
