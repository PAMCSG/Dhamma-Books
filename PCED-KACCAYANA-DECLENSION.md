# PCED Kaccāyana Declension and Verb Standard

Effective: 20 September 2026

## Purpose

PCED keeps grammatical identification and form generation as separate
operations so that their sources are visible and are never silently mixed.

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

For verbs, Bhante U Janakābhivaṃsa's uploaded verb-ending table supplies the
eight tense/mood ending sets, while the *Ākhyāta Kappa* supplies their rules and
examples. PCED dictionary entries supply explicitly attested lexical past
forms. These three roles must remain distinguishable.

## Runtime decision sequence

1. Normalize the entered or clicked Pāli form.
2. Resolve it to a canonical lemma.
3. Read gender and morphology class from Pali Lookup.
4. Map the class or explicitly listed exceptional lemma to the teacher's group.
5. Generate forms from `kaccayana-declension.js` only when the relevant teacher
   paradigm or cross-reference has been safely encoded.
6. Otherwise display the Pali Lookup paradigm as a clearly attributed fallback.
   Never label fallback forms as Kaccāyana-generated.

## Verb decision sequence

1. Resolve the entered or clicked form to an attested PCED verb headword.
2. Identify a finite verb from explicit PCED grammatical evidence or a
   maintained teacher/Kaccāyana family before considering noun declension.
3. Generate regular present, imperative, optative, future, participle,
   absolutive and infinitive groups only for a reliably identified verb.
4. For irregular and transformed past systems, prefer complete maintained
   teacher/Kaccāyana forms.
5. Additionally index only forms explicitly labelled `【过】`, `【過】`,
   `[aor]`, `[aorist]`, or `[past]` inside the PCED verb entry.
6. Never infer an irregular past stem from the present spelling alone. Do not
   extract translated prose or accept a past candidate by substring matching.

For a recognized verb display:

`动词词形 / Verb forms: Bhante U Janakābhivaṃsa’s verb table; Kaccāyana Pāli Vyākaraṇaṁ, Ākhyāta Kappa`

Explicit PCED past citations are placed in:

`Ajjatanī / Aorist (dictionary-attested)`

## Closed teacher groups

Manogaṇa contains model `mana` and the 15 similar words explicitly listed by
the teacher: `vaco`, `vayo`, `tejo`, `tapo`, `ceto`, `tamo`, `yaso`, `ayo`,
`payo`, `siro`, `chando`, `saro`, `uro`, `raho`, and `aho`. Their applicable
senses and the three `-as` characteristics must be preserved; membership is
never inferred from an ending.

Sabbanāmagaṇa contains exactly the 28 teacher-table entries `sabba`, `katara`,
`katama`, `itara`, `añña`, `aññatara`, `aññatama`, `pubba`, `para`, `apara`,
`dakkhiṇa`, `uttara`, `adhara`, `ya`, `ta`, `eta`, `ima`, `amu`, `kiṃ`, `eka`,
`ubha`, `ubhaya`, `dvi`, `ti`, `catu`, `pañca`, `tumha`, and `amha`. Their
pronoun and numeral paradigms are transcribed from the teacher tables rather
than generated from a general suffix rule.

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
  Group 11 `ī` forms must follow the teacher's `daṇḍī` and `sukhakārī dānaṃ`
  tables exactly; Pali Lookup alternatives are not added to these tables.
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

### Verb acceptance examples

| Input | Resolution | Evidence |
| --- | --- | --- |
| `gacchati` | verb, never noun | maintained teacher/Kaccāyana family |
| `gacchi` | `gacchati` | explicit PCED `【过】` form |
| `agamā`, `agamū` | `gacchati` | Kaccāyana Hiyyattanī |
| `agamī`, `agamuṃ`, `agacchi`, `agacchuṃ` | `gacchati` | Kaccāyana Ajjatanī |
| `pavisi` | `pavisati` | explicit PCED `【过】` form |
| `cintesi` | `cinteti` | explicit PCED `【过】` / `[aor]` form |
| `kari`, `akāsi` | `karoti` | explicit PCED form-before-label record |
| `ahosi` | `hoti` | explicit PCED `【过】` form |
| `passi` | `passati` | explicit PCED `【过】` / `[aor]` form |
| `purisa` | noun | noun regression; no verb evidence |
