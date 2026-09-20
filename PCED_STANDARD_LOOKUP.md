# Standard PCED Lookup

Release date: 2026-09-20
Lookup core: 3.9.3
Dictionary data: PCED 2.0.5.0 plus the verified standard supplement

## Scope

The same `pced-lookup-core.js` and `pced-standard-data.js` files are used by:

- Dhamma-Books
- Chinese-Tipitaka
- Tipitaka-reader, including Pāli Tipiṭaka and Aṭṭhakathā word clicks

Dhamma-Books and Chinese-Tipitaka share `pced-books-popup.css`. Tipitaka-reader retains its separate reader-popup presentation while using the same lookup result.

## Lookup order

1. Normalize spelling only for matching (`ṁ` and `ŋ` are matched as `ṃ`; Unicode text is normalized).
2. Search the exact complete PCED headword and any explicitly labelled PCED
   past/aorist citation attached to a verb entry.
3. Check a verified canonical or related form when supplied by the host book.
4. Check the verified inflection workbook, then conservative morphology rules.
5. Check an approved sandhi or compound decomposition; each displayed component must itself be a complete PCED headword.
6. Return “not found” when none of the above succeeds.

Prefix, suffix, substring, and fuzzy dictionary fallbacks are not permitted.

## Inflection display

Every PCED popup provides a compact **Inflections / 词形** button when the resolved headword has a recognized paradigm. Nouns are displayed by case and singular/plural; verbs are grouped by tense, mood, participle, absolutive, and infinitive. Maintained whole-word mappings are labelled **Verified forms / 已核实词形**. Forms produced from a regular paradigm are labelled as possible forms, because irregular verbs and nouns may differ. No paradigm is displayed when the word class or pattern cannot be identified reliably.

### Pali Lookup Unicode morphology trial

The landing-page trial loads `pali-lookup-morphology.js`, generated from the
grammatical tables in Aukana Trust's Pali Lookup 2.0. Its legacy font encoding
is converted once; runtime storage, lookup, and display use Unicode Pāli only.

Noun gender and declension are taken from the dictionary's explicit
`InflectInfo` classification. Gender must not be inferred merely from a final
`-a`, `-i`, or `-u`. Regular paradigms use the database's ending tables;
irregular nouns use its stored complete forms. An unclassified noun receives
no generated table.

Inflection controls, grammatical group headings, and table headings follow
the selected English, Chinese, or Burmese lookup priority. Pali Lookup remains
the morphology source for noun identification. Finite verbs are classified
separately from their PCED grammatical evidence and the teacher/Kaccāyana verb
rules; a recognized verb is processed before any noun paradigm is considered.

### Teacher/Kaccāyana verb classification and past forms

Shared resolver 3.9.1 treats a recognized finite verb as a verb before noun
declension. This prevents citation forms such as `gacchati`, `pavisati`,
`cinteti`, and `karoti` from receiving a noun table merely because their final
letters resemble a nominal ending.

The display layer must try the resolver's canonical headword before reverse
inflection mappings. In particular, `gacchati` is also listed as a locative
singular form of the participle `gacchanta`; this secondary analysis must not
replace the exact `gacchati` verb paradigm with Group 13 noun declension.

The displayed verb system follows Bhante U Janakābhivaṃsa's verb-ending table,
checked against A. Thitzana's *Kaccāyana Pāli Vyākaraṇaṁ, Ākhyāta Kappa*.
Irregular or historically transformed past stems are not invented from the
present spelling. Instead, the resolver accepts:

- complete maintained Kaccāyana families, such as `agamā`, `agamū`, `agamī`,
  `agamuṃ`, `agacchi`, and `agacchuṃ → gacchati`; and
- past/aorist forms explicitly labelled inside a PCED verb entry, such as
  `gacchi → gacchati`, `pavisi → pavisati`, `cintesi → cinteti`,
  `kari`/`akāsi → karoti`, `ahosi → hoti`, and `passi → passati`.

Dictionary-attested past forms are displayed in an **Ajjatanī / Aorist
(dictionary-attested)** group. A syncretic form may appear in more than one
grammatical group when the source supports both functions; for example,
`cintesi` can be present second-person singular and an attested aorist form.
No unlabelled prose token, loose suffix match, or guessed irregular past form
may be promoted to a verb headword.

### Short-form and Manogaṇa corrections

Verified whole-word mappings prevent short Pāli input from falling through to
unrelated multilingual substring results: `jetu → jeti` (imperative),
`bhātu → bhātar`, and `pitu → pitar`. Plain ASCII `bhatu` is normalized through
the same verified `bhātu` relationship; it must never resolve to `labhati`.

Group 6 **Manogaṇa** is a closed lexical list: model `mana` plus the teacher's
15 similar words `vaco`, `vayo`, `tejo`, `tapo`, `ceto`, `tamo`, `yaso`,
`ayo`, `payo`, `siro`, `chando`, `saro`, `uro`, `raho`, and `aho`. Their
maintained `-a/-as` forms include the three identifying alternatives in
instrumental `-asā`, dative/genitive `-aso`, and locative `-asi`. The teacher's
semantic restrictions remain applicable (for example `vayo` “age,” `tejo`
“fire/power,” and `ayo` “iron/metal”). No ending or generic morphology code can
admit another word.

Group 9 **Sabbanāmagaṇa** is likewise closed to the teacher's 28 entries:
`sabba`, `katara`, `katama`, `itara`, `añña`, `aññatara`, `aññatama`, `pubba`,
`para`, `apara`, `dakkhiṇa`, `uttara`, `adhara`, `ya`, `ta`, `eta`, `ima`,
`amu`, `kiṃ`, `eka`, `ubha`, `ubhaya`, `dvi`, `ti`, `catu`, `pañca`, `tumha`,
and `amha`. Their teacher-table pronoun and numeral paradigms are encoded
directly; a generic “pronoun” or “numeral” label does not assign Group 9.

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
| `hatāvasesakā` | `hatāvasesaka` analysis; display `hata + avasesaka` entries |
| `dassukhīla`, `dassukhīlassa` | `dassukhīla` analysis; display `dassu + khīla` entries |
| `paṭisuṇitvā`, `paṭissuṇitvā`, `paṭissutvā` | absolutive (“having agreed/promised”) of `paṭissuṇāti` |
| `gacchi`, `pavisi`, `cintesi` | dictionary-attested past/aorist of `gacchati`, `pavisati`, `cinteti` |
| `kari`, `akāsi`, `ahosi`, `passi` | dictionary-attested past/aorist of `karoti`, `hoti`, `passati` |
| `agamā`, `agamū`, `agamī`, `agamuṃ`, `agacchi`, `agacchuṃ` | maintained teacher/Kaccāyana forms of `gacchati` |
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


## Shared terminology table layout — synchronized 7 September 2026

- Shared popup v1.3.9 uses equal, wider Pāli and Chinese widths, a narrower normally-wrapping 出处 column, and a non-wrapping 状态 column.
- Desktop layout avoids left clipping and unnecessary inner horizontal scrolling; narrow mobile screens may scroll horizontally.
- No lookup, language-gating, AI, source, status, duplicate, or deletion logic is changed.


### Future-tense verb acceptance

For verbs whose citation form ends in `-eti`, the productive `-ess-` future endings are recognized only when the reconstructed complete lemma is an attested PCED headword. Acceptance example: `viheṭhessanti → viheṭheti` (third-person plural, future).


### Dhamma Books landing-page display

The Dhamma Books landing-page PCED search displays the same inflection banner as book and Tipiṭaka Reader popups whenever the shared resolver returns an inflected result. Acceptance example: `viheṭhessanti → viheṭheti`, followed by `third-person plural, future`.
