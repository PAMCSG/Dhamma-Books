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

Every current and future reader book must load `dhamma-books-reader-standard.css` and `dhamma-books-reader-standard.js` using the current cache version. Shared CSS v1.3.5 includes the footnote/endnote popup and book-heading standards below. Shared reader standard v1.3.0 retires legacy save/go bookmark buttons so a book displays only the common bookmark control, and provides the continuous contents-to-reader behavior described below.

The shared contract provides:

- **Book Mark:** one header button and one modal supporting add, list, go and delete, stored separately for each book in the browser.
- **Search:** searches the active visible reading text, filters native reading blocks, highlights all matches, moves to the first match, reports no results, and restores the pre-search display and position when cleared.
- **Screen header:** background `#A8734F`, white text, system UI font, 18 px desktop title / 16 px mobile title, and 14 px desktop controls / 12 px mobile controls.

Book-specific content, body typography, language switching, PCED language profiles, dictionary/terminology data and AI behavior remain outside this shared standard.

### Shared colour, language and layout correction

Every reader book uses the same visual palette: primary/header brown `#A8734F`, secondary brown `#8F5D3B`, body `#F2EEE9`, paper/panel `#FFFDF9`, main text `#302A26`, pale area `#F4E8DF`, border `#DFCBBB`, muted text `#7B685A`, Pāli blue `#155CA8`, and dark Pāli blue `#0D477F`. Header text is white and header controls use translucent white.

The shared controls use English, Chinese or Burmese according to the active reading language, including bookmark-modal actions and search feedback. Bilingual books update these labels when the reading language changes.

On desktop and mobile, the complete screen header stays fixed at the top in one non-wrapping row and remains fully visible while the page scrolls. Its contents are always left-justified in this sequence: logo, book name, Contents, language button (when present), A−, A+, Book Mark, Last Position, search input, Search. The row itself must not scroll sideways. Controls may become compact on narrow screens, but they must remain usable. Search input and placeholder text must remain clearly readable and no smaller than 15 px on mobile.

The repository landing page is not a reader book and is outside this reader-interface contract.

#### Footnote and endnote popup

Every Dhamma-Books footnote or endnote popup uses a smaller, quieter header than the book screen header: 18 px on desktop and 16 px on mobile. Its header background is the shared lighter brown `#A8734F`, with white title and close-button text. The note body retains the book's normal text sizing and Pāli treatment. Shared CSS v1.3.5 applies this rule to both existing popup IDs, `noteModal` and `footnoteModal`.

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

#### Fixed contents window

The contents heading (for example, `Contents · 目录`) sits outside and immediately above the scrolling contents window. It must never be sticky inside that window or cover a contents entry. Only the entries scroll within the fixed window.

The standard contents window is tall enough to show approximately three more entry rows than the earlier Dhammapada implementation of 9 September 2026, while remaining practical on a mobile screen. A− and A+ must resize both the book's reading text and its contents headings, entries and page numbers.

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


### Language navigation pilot — 7 September 2026

Scope: Mindfulness of Breathing and the three Pāli Chanting Book editions only. `dhamma-books-language-pilot.js?v=1.0.0` is loaded after the existing reader standard in these four HTML files. Other books, including Daily Chants Burmese, are excluded.

Mindfulness index buttons open the existing combined HTML with `?lang=en` or `?lang=zh`, overriding the saved language. In-book toggles use the current section at the reading line and matching `data-section`; English endnotes have no Chinese counterpart and fall back to the conclusion. Entry links start at the cover. Book content and the combined-file structure are retained.

Each chanting edition has English / 中文 / မြန်မာ buttons. Switching carries the current passage or heading ID in the destination URL fragment. Above the reader, switching opens contents. Restoration runs after page load and offsets the target below the header. Shared IDs, rather than translation page numbers or whole-book scroll percentages, determine the position.

Validation: JavaScript syntax passed; every chanting passage/section candidate exists in all three editions. HTML changes are limited to the index buttons and one versioned script include per reader; existing text and PCED code are retained. Automated browser verification could not run because this workspace has no installed Chromium executable. Visual and live PCED checks remain required before wider rollout.


### Approved language navigation and remaining-book rollout — 7 September 2026

The user tested the merged PR #20 pilot (Mindfulness of Breathing and all three Pāli Chanting editions) and confirmed: “they are nicely done.” This is the approved Dhamma-Books language-navigation behavior.

Requirements:
- The index offers a separate button for every available reading language before entering a multilingual book.
- Combined English/Chinese readers remain one HTML file; index links select the initial language.
- Inside each multilingual book, provide buttons for all available editions. Switching goes to the corresponding passage or current section, not the cover.
- Use shared passage IDs or semantic section keys; do not equate printed page numbers across translations.
- Keep book text, language-specific typography, contents styling, PCED, search, bookmarks and Previously Read behavior.
- Scope remains Dhamma-Books only. Daily Chants Burmese retains its existing exception.

This rollout adds The Only Way for the Realization of Nibbāna, Paccayaniddeso (English/Chinese), and The Requisites of Enlightenment / 《觉悟资粮——菩提分手册》. The approved pilot files remain unchanged.

Implementation: these four reader files load `dhamma-books-language-navigation.js?v=1.0.0` after their existing scripts. The two combined readers receive English / 中文 index links using `?lang=en` and `?lang=zh`; explicit entry selection overrides the saved language and opens the cover. Their existing in-book buttons preserve the current semantic section. Cover and contents also match across languages. Where Requisites has edition-specific material, use the nearest preceding shared section (or nearest following shared section when none precedes it). These are section-level matches, not claims of sentence-level alignment.

Paccayaniddeso receives English / 中文 header buttons. Switching transfers the current visible passage or section ID through the URL fragment and restores it below the header after load. Above the main reader, switching opens contents.

Validation and deployment status are recorded with the rollout pull request. The user's pilot approval is separate from validation of these newly added books.


Rollout validation: JavaScript syntax passed; all 39 Paccayaniddeso navigation candidates exist in both editions; 354 semantic-section positions across both combined readers resolve in both directions, including cover, contents and edition-only fallback. Every existing reader HTML byte is retained apart from the added script include. Chromium is still unavailable in this workspace, so these new books require live visual checks after deployment.



### Language-navigation corrections — 7 September 2026

Follow-up to PR #21: The Only Way now uses 49 explicitly paired English/Chinese headings rather than broad chapter/page labels. The final position restoration runs after the original language handler's deferred scrolling. Switching returns to the corresponding shared subsection heading; edition-specific subsections use the preceding shared heading. This is not sentence-level alignment.

Both Paccayaniddeso headers contain English and 中文 links in the HTML, enhanced to passage-preserving buttons by the navigation script. Hide the redundant Reader / 阅读 control while retaining its element for existing reader code. Insert the language group beside Previously Read using that control's actual parent. Requisites index choices place 中文 before English. All four affected readers use navigation version 1.0.1.

Validation: JavaScript syntax and all 49 unique heading pairs checked; both static edition-link groups and hidden Reader controls verified. Browser rendering and live interaction remain unverified because Chromium is unavailable. Book text and PCED scripts are unchanged.


### The Only Way English structure and position-preserving language toggle — 8 September 2026

The English edition follows the hierarchy printed in the authoritative PAMC 07/2014 PDF. Top-level headings listed in bold in the English contents — Preface, The Great Mindfulness-Foundation Sutta, Introduction, Samatha Meditation, Vipassanā Meditation and Endnotes — use the standard prominent heading treatment: centred text on a pale panel, a lighter-brown top rule, rounded corners and the normal heading colour. Lower-level headings use a simpler left-aligned treatment with brown text and a thin divider. Pāli inside either heading inherits the heading colour.

This hierarchy is the standard for current and future Dhamma-Books text: top-level headings are prominent and centred; subheadings are simpler and left aligned. Determine hierarchy from the source book's contents and typography rather than treating every bold line as the same heading level.

Numbered and bracket-numbered passages in the English body display each printed point as a separate indented line. The implementation adds structural wrappers around the existing text and existing PCED elements; it does not rewrite the wording.

The Only Way retains its 49 explicit English/Chinese heading pairs. Navigation v1.0.2 additionally records the reader's proportional position between the surrounding paired headings before changing language, then restores the same position within the corresponding translated interval after the original language handler finishes. This makes English-to-Chinese and Chinese-to-English switching reversible within long sections instead of returning only to the beginning of a broad subsection.

Validation uses the PAMC 07/2014, 85-page printed edition (88 PDF pages including covers/front matter). The six bold top-level contents entries correspond to six centred headings; the remaining 114 English body headings use the subheading treatment. All 424 numeric or bracketed point markers found across 314 English paragraphs have structural list-item presentation, including continuations split by the source layout. English and Chinese visible reader text and all Pāli `data-word` markers are unchanged. JavaScript syntax and a simulated mid-section English/Chinese round trip passed. All fifteen readers request shared CSS and JavaScript v1.3.2; the footnote selector covers both popup structures used by the thirteen readers that currently contain notes. Automated browser rendering remains unavailable in this workspace, so deployed visual and interaction checks remain required.

### Approved heading hierarchy rollout — 8 September 2026

The approved The Only Way heading treatment now also applies to 《证悟涅槃的唯一之道》 and to both the English and Chinese editions of Mindfulness of Breathing / 《入出息念》. Major entries in each edition's contents hierarchy use the prominent centred pale-panel heading; subordinate contents entries use the simpler left-aligned heading with a thin divider. Heading Pāli inherits the heading colour, while body Pāli remains blue `#155CA8`.

Shared reader standard v1.3.3 derives the Mindfulness heading levels from its existing `toc-row sub` markers and assigns the Chinese Only Way hierarchy from the printed contents: 中译序, Chapters 1–5, and 尾注 are major headings. This changes presentation only; reader wording, contents links, language switching, bookmarks, search, notes and PCED behavior remain unchanged.

Shared reader standard v1.3.4 extends the same treatment to The Requisites of Enlightenment / 《觉悟资粮——菩提分手册》. In English, the three prefaces, Introduction, Chapters I–X and Glossary are major headings; the other 11 headings are subordinate. In Chinese, the 15 existing contents-level headings are major and the 31 existing lower-level headings are subordinate. The classification uses the book's existing elements at runtime, without rewriting its HTML or wording.

Shared reader standard v1.3.5 extends the approved hierarchy to 《止观法要》 and 《佛陀的十二种恶报》. 《止观法要》 has 10 major headings and 18 subordinate headings; its 48 third-level minor headings retain their existing smaller left-aligned treatment. 《佛陀的十二种恶报》 has 18 major headings and 6 subordinate headings. The update assigns presentation classes at runtime and does not rewrite either book's HTML or wording.


### Pāli text colour standard and staged rollout — 7 September 2026

All Pāli wording in current and future Dhamma-Books readers must be blue `#155CA8`, including embedded Pāli words and Pāli punctuation in Chinese and English body text. **Headings are an exception:** all heading wording, including Pāli terms and titles, must retain the heading’s normal colour (for example, white on brown section bars), never the body-text Pāli blue. Preserve surrounding translation colours, language fonts, text, and PCED lookup behavior. This requirement is scoped to Dhamma-Books; the Daily Chants Burmese layout exception does not create a Pāli-colour exception.

Batch 1 implements this in `mindfulness-of-breathing.html` and `the-only-way-for-realization-of-nibbana.html` (four language panels across two combined files). Each file adds a small `db-pali-blue-standard` style to its head, targeting existing `.pali-word`, `.pali-title`, and `.pali-punct` markers. Explicit colour prevents inheritance from black paragraph text. No script or shared-asset cache change is required.

Validation: removing the added style exactly reproduces each original file. Existing Pāli markers, text, data-word attributes, PCED scripts, and language-navigation fixes are unchanged. Marker styles were inspected for inline colour conflicts. Live rendered colour and interaction still require visual verification; no browser verification is claimed.

Batches 2 and 3 are implemented below. The five-book Pāli-colour rollout is complete in source; live-site appearance remains to be verified. Each batch is recorded in its own pull request.


### Pāli heading exception and complete-word correction — 7 September 2026

Follow-up to PR #23: both Batch 1 books now let Pāli markers inside headings inherit the heading colour. This covers all heading levels in both language panels and the screen header. Apply this exception in every future Pāli-colour batch. Body Pāli remains blue `#155CA8`.

In The Only Way English body text, the split `Pari` + marked `nibbāna` is now one `Parinibbāna` marker with `data-word="parinibbāna"`, preserving the visible wording and existing PCED interaction attributes.

Validation: book text and all scripts remain unchanged. Mindfulness changes only by the heading CSS rule; The Only Way additionally corrects one complete-word marker. Live browser appearance has not been verified.


### Batch 2: Requisites Pāli colour — 7 September 2026

`the-requisites-of-enlightenment.html` now applies blue `#155CA8` to existing Pāli word, title and punctuation markers in both English and Chinese body text. Headings (including section and subsection headings), screen headers and cover titles retain their normal colours. The heading exception covers markers nested inside headings and markers on heading elements themselves.

The change is one inline style block, covering 3,457 existing Pāli word markers across both editions. Removing the inserted block reproduces the original file exactly: book text, scripts, PCED attributes, language navigation, bookmarks and search remain unchanged. No shared asset version change is needed. Source preservation and uploaded content are checked; live browser rendering and deployment are not verified in this session.


### Batch 3: 止观法要 and 佛陀的十二种恶报 Pāli colour — 7 September 2026

`zhiguan-fayao.html` and `the-buddhas-twelve-kinds-of-evil-retribution.html` apply blue `#155CA8` to body Pāli markers and Pāli-only blocks, including their punctuation. Headings at every level, screen headers and cover titles retain their standard colours. The local inline styles also cover minor headings; no shared asset cache update is required.

The two Chinese books contain 373 and 1,006 Pāli word markers respectively after correction. In the Twelve Retributions paragraph `row-vipaka12-227`, the previously split `Anom` + marked `ā` is one complete `Anomā` marker, and previously unmarked `Uruvela` receives the existing keyboard/click PCED attributes. Visible wording and spelling are unchanged. Source-reference abbreviations remain unchanged.

Validation: reversing the style insertions and these two marker corrections reproduces both original HTML files byte-for-byte. Visible text, all scripts, navigation targets and search attributes are preserved. No shared PCED files, dictionary data, other books or catalogue files change. Browser rendering and live PCED interaction are not verified because Chromium is unavailable in this workspace; live-site appearance remains an explicit follow-up.
