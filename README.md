# Dhamma-Books Daily Chants PCED Pilot — revision 5

Upload these four files to the root of `PAMCSG/Dhamma-Books`, replacing only files with the same names:

- `daily-chants.html`
- `pced-lookup-core.js`
- `pced-standard-data.js`
- `pced-approved-terms.js`

Do not replace `index.html` or any other book during this pilot test.

Revision 5 includes all revision 4 inflection, final `-ñca`, `apatanā`, and doctrinal-compound improvements. It also places an approved Chinese-Tipitaka terminology entry before the PCED entries when the clicked word, or its verified inflected headword, matches a local snapshot record with status `已确认` or `规范`.

The source shown is `《汉译巴利三藏》玛欣德尊者和译藏团队`. The lookup uses the local `pced-approved-terms.js`, so it does not wait for the online database.

After deployment, hard-refresh the browser and test `bhagavā`, `bhikkhū`, `apatanā`, `pañca`, `katamañca`, `dhammañca`, `hetupaccaya`, `sotāyatana`, and `sotadhātu`.

For a future terminology refresh, regenerate `pced-approved-terms.js` from Chinese-Tipitaka and replace only that shared file; the HTML books do not need to be edited.
