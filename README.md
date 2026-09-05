# Dhamma-Books Daily Chants PCED Pilot — revision 6

First deploy the one-time `Chinese-Tipitaka-Approved-Terms-Feed` package to `PAMCSG/Chinese-tipitaka`.

Then upload these four files to the root of `PAMCSG/Dhamma-Books`, replacing only files with the same names:

- `daily-chants.html`
- `pced-lookup-core.js`
- `pced-standard-data.js`
- `pced-approved-terms.js`

Do not replace `index.html` or any other book during this pilot test.

Revision 6 bundles all 2,143 approved records from the 5 September 2026 database export: 2,106 `规范` and 37 `已确认`. The approved Chinese entry appears before the ordinary PCED entries when the clicked word or its verified inflected headword matches.

The popup never waits for the online database. It opens from the bundled or browser-cached data, while a background task checks the central approved feed at most once every six hours. Future Chinese-Tipitaka updates require no changes to individual HTML books.

After deployment, hard-refresh the browser and test `bhagavā`, `bhikkhū`, `apatanā`, `pañca`, `katamañca`, `dhammañca`, `hetupaccaya`, `sotāyatana`, and `sotadhātu`.
