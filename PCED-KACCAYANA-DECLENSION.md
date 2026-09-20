# PCED Kaccāyana Declension Standard

Effective: 20 September 2026

## Purpose

PCED keeps identification and declension generation as separate operations so
that their sources are visible and are never silently mixed.

## Authoritative sources and roles

1. **Pali Lookup version 2.0 morphology data** identifies the normalized lemma,
   grammatical gender, stem and morphology class. The final letter of the
   clicked surface form must not be used by itself to decide gender.
2. **Bhante U Janakābhivaṃsa, _13 Groups - List of Declension_ (revised July
   2019)** supplies the practical 13-group organization and the displayed
   declension paradigms.
3. **A. Thitzana, _Kaccāyana Pāli Vyākaraṇaṁ, Volume 2, New MLBD Edition_
   (21 December 2021)** supplies the underlying Kaccāyana grammatical rules,
   explanations, optional operations and canonical-usage principle.

The teacher's 13 groups are a pedagogical synthesis of the Kaccāyana tradition,
not a verbatim 13-item chapter in the root grammar. Some tables also expressly
refer to Rūpasiddhi; the interface therefore calls the output “Kaccāyana-based”.

## Runtime decision sequence

1. Normalize the entered or clicked Pāli form.
2. Resolve it to a canonical lemma.
3. Read gender and morphology class from Pali Lookup.
4. Map the class or explicitly listed exceptional lemma to the teacher's group.
5. Generate forms from `kaccayana-declension.js` only when the relevant teacher
   paradigm or cross-reference has been safely encoded.
6. Otherwise display the Pali Lookup paradigm as a clearly attributed fallback.
   Never label fallback forms as Kaccāyana-generated.

## Source labels in the popup

For a Kaccāyana-generated table display both:

`性别及词干识别 / Gender and stem identification: Pali Lookup version 2.0`

`变格组及词形 / Declension group and forms: Bhante U Janakābhivaṃsa’s Kaccāyana-based 13 Groups of Declension`

For a fallback table retain:

`来源 / Source: Pali Lookup version 2.0`

## Initial encoded coverage

- Groups 1, 2 and 3: regular masculine `a`, neuter `a`, and feminine `ā` nouns.
- Regular `adj.a` adjectives in all three genders: masculine Group 1,
  feminine Group 3, and neuter Group 2.
- `kamma`: an explicit Group 2 lexical correction. Pali Lookup labels it
  `nt.x` without a stem, but its declension follows the regular neuter
  `a`-stem Cittādigaṇa paradigm.
- Group 4: explicit teacher paradigms for `puma`, `yuva` and `addhāna`.
- Group 5: explicit teacher paradigm for `rāja`.
- Groups 7 and 8: feminine `ī` and listed `inī` classes.
- Group 10: regular agent class and the explicit `mātu` paradigm.
- Group 11: encoded `i`, `u`, and masculine/neuter `ī/in` stem classes plus
  explicit `bhikkhu` and `go`. For `adj.ī` compounds such as `kammavādī`, the
  masculine and neuter follow Group 11, while the feminine `-inī` follows
  Group 8.
- Group 12: masculine, feminine and neuter `vantu/mantu` paradigms; feminine
  forms follow Group 7.
- Group 13: masculine, feminine and neuter present-participle paradigms plus
  teacher-listed special handling for `arahanta`, `mahanta` and `santa`.

Groups 6 and 9, additional Group 11 stem types, and unverified members of short
exception lists remain attributed Pali Lookup fallbacks until their complete
teacher/Kaccāyana rule sets are encoded and tested.

## Canonical-usage safeguard

Kaccāyana Volume 2 states that gender and word forms are to be established in a
way that does not contradict canonical usage. Stem endings overlap between
genders, so spelling alone is evidence but not a sufficient gender rule.

Classification order is: an explicit teacher/Kaccāyana lexical classification;
then the Pali Lookup morphology class; then a documented lexical correction for
an unspecified `x` record. A compound is classified from its final member, so
`kammavādī` follows `vādī`, not `kamma`.

## Three-path synchronization

Every change must be deployed and tested together in:

1. Dhamma-Books in-book word-click popups.
2. Dhamma-Books landing-page search from `index.html`.
3. Tipitaka-Reader word-click popups for every sutta.

Required shared files are `kaccayana-declension.js`, `pced-lookup-core.js`, and
the repository's `pced-popup-standard.js`; Dhamma-Books also uses
`pced-index-search.js`. Loader cache versions must be increased whenever any of
these JavaScript files changes.

## Acceptance examples

| Input | Gender/class source | Teacher group | Expected nominative singular |
| --- | --- | --- | --- |
| `purisa` | Pali Lookup `m.a` | 1 Purisādigaṇa | `puriso` |
| `citta` | Pali Lookup `nt.a` | 2 Cittādigaṇa | `cittaṃ` |
| `vedanā` | Pali Lookup `f.ā` | 3 Kaññādigaṇa | `vedanā` |
| `khatta` | Pali Lookup `nt.a` | 2 Cittādigaṇa | `khattaṃ` |
| `bhagavantu` | Pali Lookup `adj.v` | 12 Guṇavādigaṇa | `bhagavā`, `bhagavanto` |
| `gacchanta` | Pali Lookup present participle | 13 Gacchantādigaṇa | `gacchaṃ`, `gacchanto` |
