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
- Popup dragging is constrained to the viewport so the window and close control cannot be lost off-screen.
- `patisambhidamagga.html` now loads the same shared popup standard. Its embedded PCED dictionary was externalized unchanged to `patisambhidamagga-pced-data.js`; exact data equivalence and all inline JavaScript were verified.


## Unified popup presentation — 6 September 2026

- Shared popup layer updated to `pced-popup-standard.js` v1.1.0.
- All legacy PCED popup shells use the approved dark-brown title bar, paper background, blue Pāli headword, tiered heading sizes, and consistent serif text.
- Language headings are standardized as `中文`, `English`, `Burmese`, `Japanese`, `Vietnamese`, `Korean`, and `Other`, with a light-brown heading background.
- Exact single-word Chinese-Tipiṭaka matches appear once under `中文` in one unshaded framed group headed `《汉译巴利三藏》玛欣德尊者和译藏团队`; multiple meanings are combined and each retains its 出处.
- Sentence records are excluded from a single-word Chinese-Tipiṭaka lookup.
- Reader tab names use compact button styling with a light-brown background.
- Popup movement now covers current and legacy panel/header class structures, dynamically added modals, pointer and touch dragging, viewport bounds, and resize correction.

## Current handoff checkpoint — 6 September 2026

### Completed in GitHub

- Popup implementation: [`4f3db74`](https://github.com/PAMCSG/Dhamma-Books/commit/4f3db7457220aad8056b88f99a1e6b4dbe0689d0) on the default branch.
- Chinese-Tipiṭaka feed fields `type`, `source`, and `page`: [`6b87e86`](https://github.com/PAMCSG/Chinese-tipitaka/commit/6b87e865ec64445d02c2187b4aa323c3b91ae490).
- Paṭisambhidāmagga shared-popup connection: [`5661f93`](https://github.com/PAMCSG/Dhamma-Books/commit/5661f93b9dbc7775d00f53ae24444ba03a78e449).
- Static verification passed for JavaScript syntax, shared-file equivalence, language-heading normalization, one combined Chinese-Tipiṭaka subheader, source display, single-word filtering, and popup drag installation.

### Deployment verification still pending

The deployed `tipitaka-reader.pages.dev` site is protected by Cloudflare Access. An unauthenticated browser is redirected to the Cloudflare sign-in page, so the deployed asset version and final appearance cannot be independently inspected from outside the protected session. The GitHub implementation is complete; authenticated visual acceptance on the live Pages deployment remains the next checkpoint.

### Resume here

1. Open a deployed book while authenticated and perform a hard refresh.
2. Test a Pāli word with multiple Chinese-Tipiṭaka results: confirm one `中文` heading, one `《汉译巴利三藏》玛欣德尊者和译藏团队` subheader, Chinese meanings plus `出处`, and no sentence records.
3. Confirm `English`, `Burmese`, and other language headings use the light-brown style without bilingual duplicates.
4. Drag the popup by its title bar and confirm the compact light-brown reader tab buttons.
5. Record the exact book URL and screenshot for any remaining book-specific exception.
