# PCED Three-Path Synchronization Standard

Effective: 20 September 2026

Every PCED morphology, inflection, attribution, compound-analysis, sandhi, or popup-display request must be reviewed, updated, and tested in all three user entry paths at the same time:

1. Dhamma-Books in-book word-click popups (`pced-popup-standard.js`).
2. Tipitaka-reader word-click popups (its repository copy of `pced-popup-standard.js`).
3. Dhamma-Books landing-page search popup opened from `index.html` (`pced-index-search.js`).

The same recognized inflected word must be tested in all three paths. The displayed headword, analysis, inflection table, labels, cautions, and attribution must agree.

The expanded inflection panel must display:

`来源 / Source: Pali Lookup version 2.0`

When a JavaScript renderer changes, every HTML loader that references it must receive a new cache-version query before release. A change is incomplete if only one or two entry paths are updated.
