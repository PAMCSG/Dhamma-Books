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
