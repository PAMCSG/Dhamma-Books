# PAMC Dhamma Books

The `main` branch is the authoritative source for the current Dhamma Books website.

## Shared PCED files

- `pced-lookup-core.js` — exact and verified-form resolver
- `pced-standard-data.js` — maintained inflections, aliases, compounds, and sandhi
- `pced-approved-terms.js` — approved Chinese-Tipiṭaka terminology snapshot
- `pced-popup-standard.js` — cross-book popup display, reset, and movement behavior

PCED-enabled books use the Daily-Chants standard:

1. Approved Chinese-Tipiṭaka entry, when precisely matched
2. Chinese PCED entries
3. English
4. Burmese
5. Other correctly identified languages

Popups reopen at the beginning and remain movable within the visible screen. Prefix, substring, and fuzzy dictionary fallbacks are not allowed.

See `PCED-LOOKUP-UPDATE-REPORT.md` for rollout details and tests.

## Shared reader controls and screen header — 7 September 2026

Every current and future reader book must load `dhamma-books-reader-standard.css` and `dhamma-books-reader-standard.js` using the current cache version. Shared reader standard v1.3.0 retires legacy save/go bookmark buttons so a book displays only the common bookmark control, and provides the continuous contents-to-reader behavior described below.

The shared contract provides:

- **Book Mark:** one header button and one modal supporting add, list, go and delete, stored separately for each book in the browser.
- **Search:** searches the active visible reading text, filters native reading blocks, highlights all matches, moves to the first match, reports no results, and restores the pre-search display and position when cleared.
- **Screen header:** background `#A8734F`, white text, system UI font, 18 px desktop title / 16 px mobile title, and 14 px desktop controls / 12 px mobile controls.

Book-specific content, body typography, language switching, PCED language profiles, dictionary/terminology data and AI behavior remain outside this shared standard.

### Shared colour, language and layout correction

Every reader book uses the same visual palette: primary/header brown `#A8734F`, secondary brown `#8F5D3B`, body `#F2EEE9`, paper/panel `#FFFDF9`, main text `#302A26`, pale area `#F4E8DF`, border `#DFCBBB`, muted text `#7B685A`, Pāli blue `#155CA8`, and dark Pāli blue `#0D477F`. Header text is white and header controls use translucent white.

The shared controls use English, Chinese or Burmese according to the active reading language, including bookmark-modal actions and search feedback. Bilingual books update these labels when the reading language changes. At normal desktop width, controls stay on the main header row; mobile may wrap.

The repository landing page is not a reader book and is outside this reader-interface contract.

### Contents-page and continuous-reading standard — Dhamma-Books only

This standard applies only to current and future books in the **PAMCSG/Dhamma-Books repository**. It does not apply to Tipitaka-reader, Chinese-tipitaka, Meditation-App, or the repository landing page.

**Exception:** Daily Chants Burmese (`daily-chants-burmese.html`) retains its existing behavior and contents-page layout; do not change it as part of this standard.

#### Continuous reading

For every other book, **main text follows contents continuously** in the same page. Contents and Reader controls scroll to their respective positions without hiding either section. Contents links must reach the corresponding heading without a screen header or column-label row covering it.

Preserve all book wording, paragraph order, translations, footnotes, PCED lookup functions, bookmarks, search, and Previously Read behavior. Contents-page column rules do not change side-by-side language columns in the main text. Preserve the existing Pāli Chanting English paired `VANDANĀ | Homage` heading and the fix that keeps its column-label row from covering the title.

#### Contents-page columns

| Book category | Contents layout |
| --- | --- |
| Chanting Book 念诵本, except Daily Chants Burmese | One or two columns permitted; two columns should collapse to one on narrow screens. |
| All other Dhamma-Books categories | One column only on desktop and mobile. |
| Daily Chants Burmese | Existing layout retained; excluded from this update. |

Keep entries in the book's original reading order. Titles may wrap naturally; page numbers, where present, remain aligned and readable. Preserve all contents links and section hierarchy.

#### Contents-page colours and style

Use the repository's shared warm-brown reader palette consistently:

| Element | Colour |
| --- | --- |
| Surrounding page | `#F2EEE9` |
| Contents panel | `#FFFDF9` |
| Main entry text | `#302A26` |
| Primary headings / accents | `#A8734F` |
| Secondary accents | `#8F5D3B` |
| Pale section backgrounds | `#F4E8DF` |
| Panel borders and row separators | `#DFCBBB` |
| Muted text / page numbers | `#7B685A` |
| Pāli emphasis, where used | `#155CA8`, darker `#0D477F` |

Use consistent panel borders, rounded corners, row spacing, and heading hierarchy across contents pages. Keep language-appropriate fonts and readable sizes, with clear links and no clipped or overlapping labels. The screen-header font and size rules above remain in force.

#### Implementation status

This section records the approved standard, not a claim that every book already implements it. PR #16 enabled continuous reading for Daily Chants English and Paccayaniddeso English/Chinese, alongside the three Pāli Chanting editions. The remaining books and category-specific contents columns still require an implementation audit and any necessary changes. Daily Chants Burmese remains excluded.


### Pa-Auk and Mahinda contents styling — 7 September 2026

Implemented shared contents styling (CSS v1.3.1) for all five books currently listed in these two landing-page categories:

- **Books by The Most Venerable Pa-Auk Tawya Sayadawgyi:** `mindfulness-of-breathing.html`, `the-only-way-for-realization-of-nibbana.html`.
- **玛欣德尊者译著 / Dhamma Books authored or translated by Venerable Mahinda:** `the-requisites-of-enlightenment.html`, `zhiguan-fayao.html`, `the-buddhas-twelve-kinds-of-evil-retribution.html`.

The shared reader JavaScript v1.3.1 identifies these five filenames, adds `body.db-standard-contents`, and refreshes their existing shared CSS link to `?v=1.3.1`. Book HTML files remain byte-for-byte unchanged. Both language editions use the same cream panel, pale heading/group backgrounds, brown headings, solid warm borders, 10 px panel corners, and consistent row spacing. Contents headings are 22 px desktop / 20 px mobile; entries 18 px / 17 px; page numbers 14 px. Language fonts, natural title wrapping, subsection indentation, and right-aligned page numbers are retained. All contents remain one column; the title/page-number cells inside each row do not represent two contents columns.

This change is styling only: original contents entries/targets, book wording, reading flow, language switching, main-text styles, PCED, screen headers, bookmarks, search, and Previously Read behavior are retained. The opt-in does not affect other categories or Daily Chants Burmese. The wider continuous-reading implementation status above remains a separate audit item.


### Contents asset-loading correction — 7 September 2026

After PR #18 deployed, a user screenshot still showed the old Mindfulness of Breathing contents. The five category books still referenced shared JavaScript/CSS v1.1.0; the styling marker depended on the new JavaScript arriving through that old URL. Deployment success alone does not verify visible styling.

All five book HTML files now declare `body.db-standard-contents` directly and request both shared assets with `?v=1.3.1`. Contents styling therefore no longer depends on JavaScript initialization, and the changed URLs avoid reuse of v1.1.0 asset caches. The existing shared-JavaScript opt-in remains idempotent. For future shared-asset changes, update affected book asset URLs in the HTML, not only from inside the changed JavaScript.

Only the body class and two asset versions change in each book. Book text, all links, embedded dictionaries, PCED scripts, language controls and reader logic are preserved.


Coverage is **eight language contents pages across five HTML files**: Mindfulness of Breathing (English/Chinese), The Only Way for the Realization of Nibbāna (English/Chinese), The Requisites of Enlightenment (English/Chinese), 止观法要 (Chinese), and 佛陀的十二种恶报 (Chinese). Both `.contents` (including `.contents.zh-text`) and `.toc` panels are covered by the shared selectors, including initially hidden language panels.
