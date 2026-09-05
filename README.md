# PAMC Dhamma Books

The `main` branch is the authoritative source for the current Dhamma Books website.

## Shared PCED files

- `pced-lookup-core.js` — exact and verified-form resolver
- `pced-standard-data.js` — maintained inflections, aliases, compounds, and sandhi
- `pced-approved-terms.js` — approved Chinese-Tipiṭaka terminology snapshot
- `pced-popup-standard.js` — cross-book popup display, reset, and movement behavior

PCED-enabled books use the Daily-Chants standard:

1. Approved Chinese-Tipiṭaka entry, when precisely matched
2. Chinese PCED entries
3. English
4. Burmese
5. Other correctly identified languages

Popups reopen at the beginning and remain movable within the visible screen. Prefix, substring, and fuzzy dictionary fallbacks are not allowed.

See `PCED-LOOKUP-UPDATE-REPORT.md` for rollout details and tests.
