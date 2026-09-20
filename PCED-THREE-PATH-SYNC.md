# PCED Three-Path Synchronization Standard

Effective: 20 September 2026

Every PCED morphology, inflection, attribution, compound-analysis, sandhi, or popup-display request must be reviewed, updated, and tested in all three user entry paths at the same time:

1. Dhamma-Books in-book word-click popups (`pced-popup-standard.js`).
2. Tipitaka-reader word-click popups (its repository copy of `pced-popup-standard.js`).
3. Dhamma-Books landing-page search popup opened from `index.html` (`pced-index-search.js`).

The same recognized inflected word must be tested in all three paths. The displayed headword, analysis, inflection table, labels, cautions, and attribution must agree.

The expanded inflection panel must identify the source of the displayed forms.
Kaccāyana-generated tables show separate identification and form sources;
fallback tables display `来源 / Source: Pali Lookup version 2.0`. See
`PCED-KACCAYANA-DECLENSION.md` for the controlling standard.

Every nominal/adjectival inflection table must also display the applicable
declension group from Bhante U Janakābhivaṃsa's *13 Groups - List of
Declension* (revised July 2019), together with the gender. Examples:

- `第12组：Guṇavādigaṇa（阳性形容词，vant/mant 变格）`
- `Group 12: Guṇavādigaṇa (Masculine adjective, vant/mant declension)`

The Pali Lookup morphology class and canonical lemma determine the proposed
gender and group; the surface word ending alone must never determine them.
The displayed forms come from the Kaccāyana generator only for paradigms safely
encoded from the teacher's tables. Feminine
`vant/mant` and present-participle paradigms must state that they follow Group
7, Nadādigaṇa. If the available data cannot establish a group reliably, do not
guess or display a group number.

Do not display a separate `Verified forms / 已核实词形` list. Verified mappings are used internally to locate the canonical Pali Lookup lemma. For example, all three paths must resolve `bhagavā` through `bhagavantu` and display the adjective `vant/mant` declension, never a feminine `-ā` declension.

When a JavaScript renderer changes, every HTML loader that references it must receive a new cache-version query before release. A change is incomplete if only one or two entry paths are updated.
