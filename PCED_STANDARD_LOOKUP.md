# Standard PCED Lookup

Release date: 2026-09-04  
Lookup core: 2.1.0  
Dictionary data: PCED 2.0.5.0 plus the verified standard supplement

## Scope

The same `pced-lookup-core.js` and `pced-standard-data.js` files are used by:

- Dhamma-Books
- Chinese-Tipitaka
- Tipitaka-reader, including Pāli Tipiṭaka and Aṭṭhakathā word clicks

Dhamma-Books and Chinese-Tipitaka share `pced-books-popup.css`. Tipitaka-reader retains its separate reader-popup presentation while using the same lookup result.

## Lookup order

1. Normalize spelling only for matching (`ṁ` and `ŋ` are matched as `ṃ`; Unicode text is normalized).
2. Search the exact complete PCED headword.
3. Check a verified canonical or related form when supplied by the host book.
4. Check the verified inflection workbook, then conservative morphology rules.
5. Check an approved sandhi or compound decomposition; each displayed component must itself be a complete PCED headword.
6. Return “not found” when none of the above succeeds.

Prefix, suffix, substring, and fuzzy dictionary fallbacks are not permitted.

## Source and language display

Original PCED source labels and definition text are preserved. Source codes `A` and `S` display under Japanese, while `H` is not reclassified as Japanese. Myanmar definitions remain Unicode.

## Updating all books

Lookup logic changes are made once in `pced-lookup-core.js`. Verified shared entries and inflections are maintained in `pced-standard-data.js`. Every PCED-enabled page imports those files, so replacing the two shared files in each deployed repository updates all migrated books without editing each HTML resolver again.

New books must import the standard data before the core and apply the supplement to their embedded dictionary. They may use either the Books popup profile or the reader popup profile, but must not create a separate lookup algorithm.

## Acceptance examples

| Clicked form | Expected resolution |
|---|---|
| `tenupasaṅkami` | `tena + upasaṅkami` |
| `yañca` | `yaṃ + ca` |
| `mahāpariccāge` | `mahāpariccāga` analysis; display `mahanta + pariccāga` entries |
| `dhammacakkappavattanaṃ` | `dhammacakkappavattana` |
| `pākārantaresu` | `pākārantara` analysis; display `pākāra + antara` entries |
| `āyasmā`, `sakkacca`, `suvatthi` | exact PCED headword |

The automated suite also covers the historical `ṁ`/`ṃ`/`ŋ` variants, common `bhikkhu` forms, `gahakūṭaṁ`/`gahakūṭaṃ`, and the “no arbitrary partial match” rule.

## Central publication and consumer status rules — 6 September 2026

“Published” does not mean “approved for AI use.” The centralized publication includes every non-deleted Chinese-Tipitaka record and preserves each record's status and `出处`.

| Use | Records included |
| --- | --- |
| Centralized published data | All non-deleted records |
| Tipitaka-reader **汉译巴利三藏** tab | All matching non-deleted records in every status; `状态` displayed in its own column |
| PCED popup's Chinese-Tipitaka results | Matching non-deleted single-word records; status retained internally but not displayed |
| AI terminology priority | Only `规范` and `已确认` |
| Deleted records | Never published or displayed |

The working statuses `待核实`, `规范`, `已确认`, and `有异译` are all valid publication content. Neither `待核实` nor `有异译` may be removed from the published snapshot or reader lookup because of status. Only the AI terminology-priority step filters to `规范` and `已确认`.

## Cross-book popup presentation correction — 6 September 2026

Book popups continue to hide status. The Tipitaka-reader **汉译巴利三藏** tab is the sole exception and displays it in a dedicated column.

1. Chinese-Tipitaka matching is independent of PCED success. A matching non-deleted Chinese-Tipitaka record must be extracted and displayed even when PCED reports no reliable entry for the clicked word. Required regression example: `evaṃvaṇṇo`.
2. Every newly opened popup in every book resets to its first available tab or first language section and to the top of its content. It must not retain a previous tab or scroll position.
3. Book popups and Tipitaka-reader **PCED Dictionary** do not display `状态` or its value. The separate reader **汉译巴利三藏** tab displays `状态` for every matching non-deleted record.
4. `出处` remains displayed, and deleted records remain excluded.

## Reader tab reliability and Dhamma-Books language scope — 6 September 2026

1. `kutadantasutta.html` is the accepted Tipitaka-reader reference. Every other existing sutta must switch **汉译巴利三藏** and **AI Translation** reliably; a visually selected tab must never leave the PCED Dictionary panel displayed.
2. Standard reader tab activation takes precedence over conflicting legacy per-page tab listeners. A delayed first-tab reset must stop as soon as the user deliberately selects another tab.
3. In Dhamma-Books only, Chinese-Tipitaka table extraction and display is enabled for Chinese-version books, including the Chinese side of a bilingual reader. It is disabled for English, Burmese, and other non-Chinese versions.
4. This Dhamma-Books gate does not remove ordinary Chinese definitions originating from PCED and does not change exact, verified-inflection, compound, sandhi, source, or status rules.
5. Tipitaka-reader continues to show eligible Chinese-Tipitaka results at the beginning of **PCED Dictionary** and retains its separate **汉译巴利三藏** tab in every sutta.

## Duplicate rows and language order — 6 September 2026

1. The Tipitaka-reader **汉译巴利三藏** tab displays each matching database record once. If the direct exact-match and verified matcher paths return the same Pāli, Chinese translation, source, and status, the duplicate is removed before rendering. Distinct records with different values remain visible.
2. Dhamma-Books English versions display ordinary PCED sections as English, Chinese, Burmese, then other correctly identified languages. They do not extract or display Chinese-Tipitaka records.
3. Dhamma-Books Chinese versions and Tipitaka-reader **PCED Dictionary** display eligible Chinese-Tipitaka results first, followed by ordinary PCED Chinese, English, Burmese, then other languages.
4. Required duplicate regressions include `tena`, `kathāsallāpo`, and `Gotamo` when the database contains only one corresponding record.

## Reader terminology status and matching — 6 September 2026

1. Do not change Tipitaka-reader **PCED Dictionary**: only matching non-deleted single-word `规范` and `已确认` records are inserted there, with status hidden.
2. The separate **汉译巴利三藏** table has three columns: Pāli, 玛欣德尊者翻译 and `状态`.
3. It includes matching non-deleted records from every status. A selected word matches its exact form, verified inflection/headword, and database phrases containing that form as a complete Pāli word. Loose substring matches are prohibited.
4. The same database record is rendered once even when several matching routes find it. Deleted records remain excluded.
5. AI terminology priority remains restricted to `规范` and `已确认`.
