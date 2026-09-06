# PCED Lookup Update Report

Date: 2 September 2026  
Shared core: `pced-lookup-core.js` version 1.0.0

## Result

All 13 Dhamma Books HTML readers that provide Roman-script Pāli word lookup now load the shared PCED core.

- Newly connected to the shared core: 10 readers.
- Already connected and retained: 3 Pāli Chanting Book readers.
- Exact clicked forms remain first.
- Approved aliases, related forms, and book-specific compound mappings remain available.
- Runtime inflection candidates are accepted only when the complete proposed headword exists in the PCED subset embedded in that book.
- Pāli spelling normalization includes NFC/lowercase handling and approved equivalents such as `ṁ` → `ṃ`, `aa` → `ā`, `ii` → `ī`, and `uu` → `ū`.
- No arbitrary prefix, suffix-fragment, or substring entry is accepted as a dictionary headword.

## Readers covered

- `daily-chants.html`
- `mindfulness-of-breathing.html`
- `paccayaniddeso.html`
- `paccayaniddeso-chinese.html`
- `pali-chanting-book.html`
- `pali-chanting-book-chinese.html`
- `pali-chanting-book-burmese.html`
- `pali-chanting-book-burmese-updated.html`
- `patisambhidamagga.html`
- `the-buddhas-twelve-kinds-of-evil-retribution.html`
- `the-only-way-for-realization-of-nibbana.html`
- `the-requisites-of-enlightenment.html`
- `zhiguan-fayao.html`

## Files not requiring the Roman-script PCED core

- `index.html` is a catalogue page.
- `daily-chants-burmese.html` is a Burmese-script reader and has no Roman-script Pāli lookup interface.

## Verification

- Every inline and shared JavaScript program compiled successfully.
- Representative core tests passed for `dīghaṁ` → `dīghaṃ` / `dīgha`, `bhikkhū` → `bhikkhu`, `Magadhesu` → `magadha`, `guṇena` → `guṇa`, `paññāya` → `paññā`, and `vandāmi` → `vandati`.
- Unrelated book text, layout, navigation, bookmarks, and translation functions were not rewritten.

## Repository-wide popup standard — 5 September 2026

- Added `pced-popup-standard.js` and connected 13 PCED-enabled book pages.
- Uses the shared PCED 3.4.2 resolver: exact → verified alias → verified inflection → verified compound/sandhi; no prefix, substring, or fuzzy fallback.
- Displays approved Chinese-Tipiṭaka terminology first, followed by Chinese, English, Burmese, and other dictionary languages.
- Every popup opens at its first view and scroll position.
- Popup dragging is unrestricted so the window can be moved beyond any screen edge, matching the earlier test-reader behavior.
- `patisambhidamagga.html` now loads the same shared popup standard. Its embedded PCED dictionary was externalized unchanged to `patisambhidamagga-pced-data.js`; exact data equivalence and all inline JavaScript were verified.


## Unified popup presentation — 6 September 2026

- Shared popup layer updated to `pced-popup-standard.js` v1.1.2.
- All legacy PCED popup shells use the approved dark-brown title bar, paper background, blue Pāli headword, tiered heading sizes, and consistent serif text.
- Language headings are standardized as `中文`, `English`, `Burmese`, `Japanese`, `Vietnamese`, `Korean`, and `Other`, with a light-brown heading background.
- Exact single-word Chinese-Tipiṭaka matches appear once under `中文` in one unshaded framed group. The `《汉译巴利三藏》玛欣德尊者和译藏团队` subheader now uses the same source-label font and size as dictionary source labels; multiple meanings are combined, with each `出处` (source and page when available) displayed inline beside its Chinese meaning.
- Sentence records are excluded from a single-word Chinese-Tipiṭaka lookup.
- Reader tab names use compact button styling with a light-brown background.
- Popup movement covers current and legacy panel/header class structures, dynamically added modals, pointer and touch dragging, and unrestricted movement beyond every viewport edge.

## Current handoff checkpoint — 6 September 2026

### Completed in GitHub

- Popup implementation: [`7081b72`](https://github.com/PAMCSG/Dhamma-Books/commit/7081b72e7e6474a48615231f24b86b5be3670859) on the default branch.
- Chinese-Tipiṭaka feed fields `type`, `source`, and `page`: [`6b87e86`](https://github.com/PAMCSG/Chinese-tipitaka/commit/6b87e865ec64445d02c2187b4aa323c3b91ae490).
- Paṭisambhidāmagga shared-popup connection: [`5661f93`](https://github.com/PAMCSG/Dhamma-Books/commit/5661f93b9dbc7775d00f53ae24444ba03a78e449).
- Static verification passed for JavaScript syntax, shared-file equivalence, language-heading normalization, one combined Chinese-Tipiṭaka subheader, inline source/page display, single-word filtering, and unrestricted popup drag installation.

### Deployment verification still pending

The deployed `tipitaka-reader.pages.dev` site is protected by Cloudflare Access. An unauthenticated browser is redirected to the Cloudflare sign-in page, so the deployed asset version and final appearance cannot be independently inspected from outside the protected session. The GitHub implementation is complete; authenticated visual acceptance on the live Pages deployment remains the next checkpoint.

### Resume here

1. Open a deployed book while authenticated and perform a hard refresh.
2. Test a Pāli word with multiple Chinese-Tipiṭaka results: confirm one `中文` heading, one `《汉译巴利三藏》玛欣德尊者和译藏团队` subheader, Chinese meanings plus `出处`, and no sentence records.
3. Confirm `English`, `Burmese`, and other language headings use the light-brown style without bilingual duplicates.
4. Drag the popup by its title bar and confirm the compact light-brown reader tab buttons.
5. Record the exact book URL and screenshot for any remaining book-specific exception.

## Chinese-Tipiṭaka provenance correction — 6 September 2026

- Root cause: the bundled approved-term snapshot and its `freezeRecords()` projection retained only `id`, `pali`, `chinese`, and `status`, discarding the live API's `type`, `source`, and `page` fields.
- The projection now preserves `type`, `source`, and `page`, and the browser cache key was advanced to `pamc_pced_approved_terms_v2` so previously cached source-less records cannot mask the correction.
- The bundled fallback was enriched from the authoritative Chinese-Tipitaka standard and seed records; 244 bundled records now carry locally available source provenance even when the live API is unavailable.
- The popup renderer displays each result inline as `Chinese meaning（出处：source，page）`, omitting only unavailable components.
- End-to-end verification passed for `bhante` → `尊者（出处：《上座部佛教汉译译名用语规范》·附表四·部分南北传佛教用语对照表）`.
- Duplicate resolution now merges fields instead of allowing an empty live value to erase sourced fallback provenance. Regression verification passed for `Gotamo → Gotama → 果德玛（出处：《上座部佛教汉译译名用语规范》·附表三·古梵今巴·诸佛名）`.
- Fix commits: popup [`0bbbb57`](https://github.com/PAMCSG/Dhamma-Books/commit/0bbbb57f0c558e3af86385f2ba297e9e20df1d0d); bundled terminology [`dad3614`](https://github.com/PAMCSG/Dhamma-Books/commit/dad361496a4feb234325a25146638d4086ac6987).
