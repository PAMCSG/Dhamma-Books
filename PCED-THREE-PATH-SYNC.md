# PCED Three-Path Synchronization Standard

Effective: 20 September 2026

Every PCED morphology, inflection, attribution, compound-analysis, sandhi, or popup-display request must be reviewed, updated, and tested in all three user entry paths at the same time:

1. Dhamma-Books in-book word-click popups (`pced-popup-standard.js`).
2. Tipitaka-reader word-click popups (its repository copy of `pced-popup-standard.js`).
3. Dhamma-Books landing-page search popup opened from `index.html` (`pced-index-search.js`).

The same recognized inflected word must be tested in all three paths. The displayed headword, analysis, inflection table, labels, cautions, and attribution must agree.

## Shared implementation rule

Each repository has exactly one shared PCED implementation. Every Dhamma Book uses the Dhamma-Books shared files; every Tipitaka Reader sutta, including Kūṭadantasutta, uses the Tipitaka-reader shared files. Books and suttas must not maintain separate morphology or inflection rules. Repository-specific differences are limited to language priority, allowed terminology statuses, tabs, and surrounding interface.

`pced-popup-standard.js` verifies and loads the authoritative shared `pced-lookup-core.js` and `pali-lookup-morphology.js`. Consequently, future lookup-rule changes normally require updating only the shared files in both repositories, not every book or sutta HTML file.

The expanded inflection panel must display:

`来源 / Source: Pali Lookup version 2.0`

Do not display a separate `Verified forms / 已核实词形` list. Verified mappings are used internally to locate the canonical Pali Lookup lemma. For example, all three paths must resolve `bhagavā` through `bhagavantu` and display the adjective `vant/mant` declension, never a feminine `-ā` declension.

Every noun or adjective declension group must identify masculine, neuter, or feminine in its header. This applies to all classes, including `-a`, `-ā`, irregular and `vant/mant` paradigms. English-priority views use English gender labels, Chinese-priority views use `阳性`, `中性`, or `阴性`, and Burmese-priority views use the corresponding Burmese labels. Case and number headings follow the selected language priority. Tipitaka Reader and both Dhamma-Books entry paths must use the same paradigm.

When a JavaScript renderer changes, every HTML loader that references it must receive a new cache-version query before release. A change is incomplete if only one or two entry paths are updated.

Pali Lookup morphology requires all three runtime files together: `pali-lookup-morphology.js`, `pced-lookup-core.js` with Pali Lookup paradigm support, and `pced-popup-standard.js`. Updating the morphology dataset and popup without the lookup core leaves the legacy final-letter gender guess active and can incorrectly display `bhagavā` as feminine.
