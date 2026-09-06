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

## Generic provenance fallback — 6 September 2026

- Source-less approved terms are now compared against the 559 aligned Chinese-Tipiṭaka corpus records.
- The provenance index covers 14,884 exact and verified-inflection forms. Exact Pāli token matches are accepted directly; inflected matches require agreement with the Chinese wording before a citation is assigned.
- This conservatively added provenance to 344 previously source-less bundled terms: 180 exact-token matches and 164 verified inflected matches.
- Existing non-empty `source` and `page` values always take priority, and empty live duplicates cannot erase derived or authoritative provenance.
- The cache key is now `pamc_pced_approved_terms_v4`.
- Regression verification passed for `purohito → purohita → 国师，司祭（出处：巴利三藏 > 经藏 > 长部 > 戒蕴品 > 《古德丹德经》）`; the internal page value is not displayed.

## 6 September 2026 — source-only citations and generic official-PCED coverage

- Updated the shared popup standard to version `1.1.3`.
- Chinese Tipiṭaka results now display only `（出处：…）`. Numeric page fields remain available internally but are never appended to the popup citation.
- Popup de-duplication now ignores hidden page numbers, so the same Pāli/Chinese/source result is not repeated merely because it has several page references.
- Expanded `pced-standard-data.js` from 1,659 to 18,082 validated entries using the official PCED 2.0.5 source dictionary: 12,154 top-level headwords and 4,269 explicitly labelled sub-headwords found inside their parent PCED entries.
- The shared resolver remains conservative: a grammatical rule may propose a lemma, but it is accepted only when the complete lemma is present in the validated PCED index. No fuzzy, substring, or arbitrary prefix match was enabled.
- Cross-book regression tests passed for `bodhisattassa → bodhisatta`, `uppalaṃ → uppala`, `sīlagandho → sīlagandha`, `tagaraṃ → tagara`, `Sammadaññā → sammadañña`, `purohito → purohita`, and `gotamo → gotama`.

## All-status publication correction — 6 September 2026

- Requirements were documented before implementation in the authoritative master requirements version 1.8 and in `PCED_STANDARD_LOOKUP.md` commit `5ffee61`.
- Display matching now includes every non-deleted published single-word record, including `待核实`, `规范`, `已确认`, and `有异译`; status and `出处` are retained in the popup. Core commit: `18dbd29`; popup commit: `083be36`.
- No publication control was added to Dhamma-Books. Publication remains an authenticated Chinese-Tipitaka administration action.
- AI terminology priority remains restricted to exactly `规范` and `已确认` in the shared browser logic.
- Static verification passed for shared-file equality with Tipitaka-reader, all-status display mode, status/source rendering, approved-only AI filtering, absence of reader-side publication controls, centralized published-feed use, all-non-deleted publication SQL, and JavaScript syntax.

## Popup extraction and initial-view correction — 6 September 2026

- The requirement was saved before implementation in authoritative master version 1.9 and repository documentation commit `7ac7f8e`.
- Shared popup standard v1.3.0 makes exact Chinese-Tipitaka matching independent of PCED headword resolution, so a published `evaṃvaṇṇo` record can render even when PCED reports no reliable entry.
- Each newly opened popup now resets once to its first available tab/section and to scroll position zero; modal attribute changes while already open no longer re-run initialization and restore stale tab state.
- Popup Chinese-Tipitaka blocks and the Tipitaka-reader terminology table no longer display `状态`. The status field remains in published data and the AI priority filter still accepts only `规范` and `已确认`.
- `出处` remains visible and deleted records remain excluded.
- Code commit: `6386a3ad3ba6885203d71d6b4df8aefa72ad5cd2`. GitHub verification confirmed identical popup blobs in both reader repositories, valid JavaScript syntax, no status label/column, exact-match fallback presence, source rendering, and unchanged AI status filtering.

## Shared popup v1.3.1 — 6 September 2026

- Kept the shared popup asset byte-identical with Tipitaka-reader.
- The new same-database `/api/records` merge is gated to reader mode; Dhamma-Books continues using the centralized published snapshot.
- JavaScript syntax, hidden status presentation, visible source presentation, and shared-file equality checks passed.

### Paṭisambhidāmagga screenshot path

The reported screenshot was matched to `patisambhidamagga.html` and its `#pced-modal` shell. That page now requests `pced-popup-standard.js?v=1.3.2`; v1.3.2 reprocesses the real modal immediately after the embedded host click and again when Chinese-Tipitaka data finishes loading.

## Reader-tab reliability and Dhamma-Books language gate — 6 September 2026

- The approved requirements were recorded before implementation in the controlling master document version 16 and in `PCED_STANDARD_LOOKUP.md`.
- Shared popup v1.3.5 prevents legacy per-sutta tab listeners from restoring PCED content after **汉译巴利三藏** or **AI Translation** is selected.
- Delayed initial-tab callbacks now stop once the user has deliberately selected a tab, eliminating the intermittent first-tab race.
- In Dhamma-Books, Chinese-Tipitaka table results are enabled only for Chinese book contexts. English, Burmese, and other non-Chinese contexts retain ordinary PCED results without Chinese-Tipitaka insertion. Bilingual readers use the language panel containing the clicked word.
- Tipitaka-reader remains enabled for Chinese-Tipitaka results in **PCED Dictionary** and its separate **汉译巴利三藏** tab.
- Static verification passed for JavaScript syntax, byte-identical shared popup files, legacy-listener interception, first-tab race guards, and nine reader/language-profile cases. The local browser package lacked its executable and the browser download was blocked by the test environment gateway, so deployed interaction testing remains required after merge.

## Duplicate-row and language-order correction — 6 September 2026

- Shared popup v1.3.6 de-duplicates Chinese-Tipitaka rows before rendering the Tipitaka-reader **汉译巴利三藏** table. The exact and verified matching paths can no longer display the same database record twice; distinct meanings, sources, or statuses remain separate.
- Dhamma-Books now passes the current book language into the shared dictionary-group renderer. English versions display English → Chinese → Burmese → other languages and continue to omit Chinese-Tipitaka extraction. Chinese versions display Chinese-Tipitaka first, then Chinese → English → Burmese → other languages.
- Tipitaka-reader keeps Chinese-Tipitaka first within **PCED Dictionary**, followed by Chinese → English → Burmese → other languages.
- Static verification passed for JavaScript syntax, byte-identical shared popup files, nine Chinese-Tipitaka inclusion profiles, four language-order profiles, and duplicate removal while retaining a distinct alternative translation.
