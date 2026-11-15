# ROUTELY security hardening report

## Changes in this package
- Hardened local-data loading and backup restoration with field allow-lists, string-length limits, bounded arrays, numeric/date/type validation, currency allow-listing, fresh cryptographic record IDs, and itinerary relationship remapping.
- Limited backup imports to 2 MB and added file-read error handling.
- Made storage write failures visible to the user.
- Added Netlify security response headers and an HTML CSP/referrer-policy fallback for static hosts.
- Restricted the service worker to same-origin app-shell assets, stopped caching navigation responses, and excluded third-party API responses.

## Verification performed
- JavaScript syntax checks: passed for `app.js` and `sw.js`.
- Hostile backup normalization test: passed; injected HTML strings were retained only as text values, attacker-supplied IDs were replaced, trip-item references were remapped, and invalid currency/numeric values were constrained.
- Archive listing/integrity check: performed after packaging.

## Remaining limitations
- The current interface uses inline event-handler attributes and inline styles, so the CSP currently includes `'unsafe-inline'`. This is a meaningful residual risk reduction gap. A follow-up refactor should remove inline handlers/styles and tighten CSP without that directive.
- GitHub Pages does not provide configurable response headers for ordinary static hosting. Netlify receives the configured headers; the HTML CSP is the fallback on GitHub Pages, but it cannot replace header-only controls such as HSTS and `frame-ancestors`.
- Browser localStorage is not encrypted. Anyone with access to the same unlocked browser profile may be able to read the user's local travel data.
- Public geocoding, routing, map-tile and exchange-rate providers receive relevant requests and remain third-party dependencies.
- No live penetration test, independent audit, or production header scan was performed. This report does not certify the application as perfectly secure.
