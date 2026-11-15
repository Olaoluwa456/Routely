ROUTELY — INSTALLABLE TRAVEL PLANNER
===================================

CONTENTS
- index.html       Main application
- styles.css       Responsive interface
- app.js           Application features and local data
- sw.js            Offline app-shell caching
- manifest.webmanifest  Installable PWA settings
- icon.svg         Application icon

FEATURES
- Create, edit and delete journeys
- Set starting point, destination, dates, travellers and status
- Add itinerary activities, times, locations, notes and estimated costs
- Open an itinerary location in Google Maps
- Save destinations and destination notes
- Set per-trip budget totals and category estimates
- Compare recorded itinerary costs with a planned budget
- Export a single trip itinerary as JSON
- Export and restore a full local data backup
- Choose a display currency
- Destination inspiration cards that can be saved to your destination list
- Approximate driving route distance/time and interactive map using OpenStreetMap, Nominatim and OSRM public services
- Indicative live currency conversion using a public exchange-rate endpoint
- Responsive desktop and mobile interface
- PWA install support and cached app shell for offline use

IMPORTANT DATA / CONNECTIVITY NOTES
- No sign-in or account is required.
- Trip data is stored in browser localStorage on the current device/browser.
- Data is not synchronised between devices and may be lost if browser data is cleared.
- Export backups regularly from Settings & data.
- Budget figures are manually entered estimates; the app does not fetch live fares,
  exchange rates, accommodation prices or booking availability.
- Google Maps links require an internet connection.
- The app shell can be cached for offline use after the first successful load.
- The Google Fonts stylesheet is optional; system fonts remain available if offline.

DEPLOY TO NETLIFY (NO BUILD COMMAND)
1. Extract ROUTELY-PWA.zip.
2. Open Netlify and choose Add new site > Deploy manually
   (or drag the extracted folder contents into the deploy area).
3. Upload the contents of this folder. Ensure index.html is at the published root.
4. No build command is required. No publish subdirectory is required.
5. Open the HTTPS site once while online, then use the browser's Install option
   (or Add to Home Screen on supported mobile browsers).

LOCAL PREVIEW
Open index.html directly for a basic preview. Browser restrictions mean service-worker
offline/PWA installation generally require HTTPS or localhost. Netlify provides HTTPS.

SECURITY / PRIVACY
This is a static, account-free client-side application. It has no backend and does not
collect or transmit trip records. Anyone with access to the same browser profile may
be able to access its local data. Do not store passport numbers, payment card details,
or other highly sensitive information in trip notes.


ADVANCED ONLINE SERVICES
- Interactive maps use Leaflet and OpenStreetMap tiles.
- Place search uses the public Nominatim service. Requests are deliberately sequential
  with a pause between origin and destination lookups; avoid repeated rapid searches.
- Driving route estimates use the public OSRM demo endpoint. It is a shared demo
  service, not a guaranteed production API or a live traffic navigation system.
- Currency conversion uses the public open.er-api.com endpoint. Rates are indicative,
  may be delayed, and may differ from bank/card/payment-provider rates.
- These external services require internet access and are not guaranteed by ROUTELY.
- For a commercial/high-volume launch, arrange suitable service providers, review their
  current terms and usage policies, and consider hosting or contracting reliable APIs.

SECURITY HARDENING NOTES (v1.1)
- Imported backups are size-limited and normalized against a strict allow-list of fields, types, lengths, currencies, dates and numeric ranges. Imported record IDs are regenerated and itinerary references remapped, preventing attacker-controlled IDs from reaching inline HTML attributes.
- Local browser data is normalized on load. Browser localStorage is not encrypted; use a trusted, device-locked browser profile and do not store passwords, passport numbers, payment-card data or other highly sensitive information in trip notes.
- Netlify deployments receive security response headers from netlify.toml / _headers. GitHub Pages does not allow custom response headers; the HTML includes a CSP and referrer-policy fallback, but header-only protections such as HSTS and frame-ancestors cannot be fully configured there.
- The current app still uses inline event-handler attributes and inline styles. For compatibility, the CSP allows 'unsafe-inline'; this is a known hardening limitation, not an ideal final CSP. A future refactor should move all handlers and styles to external files and remove that allowance.
- Route geocoding, routing, map tiles and currency rates use third-party public services. Search locations and currency requests are sent to those providers. Their availability and privacy practices are outside ROUTELY's control.
- Static PWA offline caching is limited to the app shell. API responses and user data are not cached by the service worker.
- This package has not undergone an independent penetration test or a live production security-header scan. Do not advertise it as perfectly secure or certified.
