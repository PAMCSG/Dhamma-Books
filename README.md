# Dhamma-Books Daily Chants PCED Pilot — revision 8

Upload these four files to the root of `PAMCSG/Dhamma-Books`, replacing only files with the same names:

- `daily-chants.html`
- `pced-lookup-core.js`
- `pced-standard-data.js`
- `pced-approved-terms.js`

Do not replace `index.html` or any other book during this pilot test.

Revision 8 updates the shared lookup core to version 3.4.0 and adds these verified sandhi analyses:

- `panāhaṃ → pana + ahaṃ` (never the legacy unrelated result `nāhaṃ`)
- `etadavoca → etaṃ + avoca`

Daily Chants now displays its ordinary PCED language groups in the standard book order: Chinese, English, Burmese, then the remaining correctly identified languages. An approved `已确认`/`规范` entry from 汉译巴利三藏 still appears before those PCED groups when available.

The same shared core is supplied in the Tipitaka-reader revision 8 package.

After deployment, hard-refresh the browser and test `panāhaṃ`, `etadavoca`, `apatanā`, `pañca`, `katamañca`, `dhammañca`, `hetupaccaya`, `sotāyatana`, and `sotadhātu`.
