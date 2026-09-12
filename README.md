# PAMC Dhamma Books

The `main` branch is the authoritative source for the current Dhamma Books website.

## Standard maintenance workflow

Begin every change from the latest GitHub `main` and read the current repository documentation before editing. Do not use an older local copy or memory as the authoritative input. Unless the user explicitly authorizes repository writes for that individual task, make and validate the changes locally and return only the changed output files for manual upload; also provide one ZIP archive containing those same changed files. Do not push, open a pull request, merge or deploy. Preserve unrelated files, book content and established reader functions.

## Reader interface standard

`BOOK-READER-INTERFACE-STANDARD.md` is the authoritative, reusable standard for improving an existing reader book or creating a new one. It consolidates the approved requirements for the screen header, mobile behaviour, Contents panel, cover layout, font controls, Search, Book Mark, language editions, non-regression protection and acceptance testing. Use Dhammapada as the approved implementation example and Daily Chants Burmese as the mobile sticky-header and Contents-window behaviour reference.

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

Popups reopen at the beginning and remain movable within the visible screen. On mobile, they open below the complete visible book header, keep both the book header and their own header and close button visible, and scroll long results internally within the remaining viewport. Prefix, substring, and fuzzy dictionary fallbacks are not allowed.

See `PCED-LOOKUP-UPDATE-REPORT.md` for rollout details and tests.

## Shared reader controls and screen header — 7 September 2026

Every current and future reader book must load `dhamma-books-reader-standard.css` and `dhamma-books-reader-standard.js` using the current cache version. Shared CSS v1.3.20 and reader runtime v1.3.18 include the Daily Chants English conformance rules below. The shared reader standard retires legacy save/go and automatic last-read controls so a book displays only the common bookmark control, and provides the continuous contents-to-reader behavior described below.

Readers using the repository-wide book-cover and width treatment also load `dhamma-books-cover-width-standard.css?v=1.0.0` after their legacy book styles. `db-book-cover-standard` applies the Daily Chants English rounded cream cover card while `db-page-standard-width` applies the centred 1080 px desktop container; `db-page-wide-reader` records that a named two-column reader retains its approved wider width.

The shared contract provides:

- **Book Mark:** one header button and one modal supporting add, list, go and delete, stored separately for each book in the browser.
- **Search:** searches the active visible reading text, filters native reading blocks, highlights all matches, moves to the first match, reports no results, and restores the pre-search display and position when cleared.
- **Screen header:** background `#A8734F`, white text, system UI font, 18 px desktop title / 16 px mobile title, and 14 px desktop controls / 12 px mobile controls.

Book-specific content, body typography, language switching, PCED language profiles, dictionary/terminology data and AI behavior remain outside this shared standard.

### Shared colour, language and layout correction

Every reader book uses the same visual palette: primary/header brown `#A8734F`, secondary brown `#8F5D3B`, body `#F2EEE9`, paper/panel `#FFFDF9`, main text `#302A26`, pale area `#F4E8DF`, border `#DFCBBB`, muted text `#7B685A`, Pāli blue `#155CA8`, and dark Pāli blue `#0D477F`. Header text is white and header controls use translucent white.

The shared controls use English, Chinese or Burmese according to the active reading language, including bookmark-modal actions and search feedback. Bilingual books update these labels when the reading language changes.

On desktop, the complete screen header stays fixed at the top in one non-wrapping row. On mobile, follow the Pāli Chanting Burmese pattern: use one sticky, naturally sized two-row header that remains together at the top during page scrolling. The first row contains the logo, book name, Contents, language button (when present), A−, A+ and Book Mark; the second row contains the search input followed by Search. Both rows are always left-justified and remain fully visible. The page, header and book body must fit the layout viewport and must not slide sideways during normal unzoomed scrolling. Preserve the browser's native two-finger pinch-to-zoom; do not use `user-scalable=no`, a restrictive `maximum-scale`, or touch rules that disable zooming. Search input and placeholder text must remain clearly readable and no smaller than 15 px on mobile.

The repository landing page is not a reader book and is outside this reader-interface contract.

#### Footnote and endnote popup

Every Dhamma-Books footnote or endnote popup uses a smaller, quieter header than the book screen header: 18 px on desktop and 16 px on mobile. Its header background is the shared lighter brown `#A8734F`, with white title and close-button text. The note body retains the book's normal text sizing and Pāli treatment. Shared CSS v1.3.5 applies this rule to both existing popup IDs, `noteModal` and `footnoteModal`.

### Contents-page and continuous-reading standard — Dhamma-Books only

This standard applies only to current and future books in the **PAMCSG/Dhamma-Books repository**. It does not apply to Tipitaka-reader, Chinese-tipitaka, Meditation-App, or the repository landing page.

Daily Chants Burmese (`daily-chants-burmese.html`) originally served as the behaviour reference and was excluded from the early rollout. Its 11 September 2026 conformance update now applies the same Contents-window and continuous-reading requirements while preserving its Burmese content and source-faithful printed-page layouts.

#### Continuous reading

For every book, **main text follows contents continuously** in the same page. Contents and Reader controls scroll to their respective positions without hiding either section. Contents links must reach the corresponding heading without a screen header or column-label row covering it.

Preserve all book wording, paragraph order, translations, footnotes, PCED lookup functions, bookmarks and search. Contents-page column rules do not change side-by-side language columns in the main text. Preserve the existing Pāli Chanting English paired `VANDANĀ | Homage` heading and the fix that keeps its column-label row from covering the title.

#### Contents-page columns

| Book category | Contents layout |
| --- | --- |
| Every Dhamma-Books category, including Chanting Book 念诵本 | One column only on desktop and mobile. |

Keep entries in the book's original reading order. Titles may wrap naturally; page numbers, where present, remain aligned and readable. Preserve all contents links and section hierarchy.

#### Fixed contents window

Use the Daily Chants Burmese contents panel as the structural reference. Each contents panel has one rounded outer frame, with no separate inner frames around its groups. Its title sits in the original pale pink-brown header strip using background `#F4E9DF` and title text `#66442F`, and remains outside the scrolling entries so it never covers an entry. A button in the same header strip opens and collapses the entries; the screen-header Contents button always opens the panel before scrolling to it.

Use only `目录` as the contents-panel title in a Chinese book and only `Content` in an English book. The scrolling entries retain each book's existing colours, fonts and styles, apart from removing inner group frames.

The entries window uses the Daily Chants Burmese height plus approximately one normal entry row: `calc(52vh + 3.2em)` on desktop and `calc(46vh + 3.2em)` on mobile. A− and A+ must resize both the book's reading text and its contents headings, entries and page numbers.

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
| Contents title-strip background | `#F4E9DF` |
| Contents title text | `#66442F` |
| Panel borders and row separators | `#DFCBBB` |
| Muted text / page numbers | `#7B685A` |
| Pāli emphasis, where used | `#155CA8`, darker `#0D477F` |

Use consistent panel borders, rounded corners, row spacing, and heading hierarchy across contents pages. Keep language-appropriate fonts and readable sizes, with clear links and no clipped or overlapping labels. The screen-header font and size rules above remain in force.

#### Implementation status

This section records the approved standard, not a claim that every book already implements it. PR #16 enabled continuous reading for Daily Chants English and Paccayaniddeso English/Chinese, alongside the three Pāli Chanting editions. Daily Chants Burmese joined this standard on 11 September 2026. Remaining books still require an implementation audit and any necessary changes.


### Pa-Auk and Mahinda contents styling — 7 September 2026

Implemented shared contents styling (CSS v1.3.1) for all five books currently listed in these two landing-page categories:

- **Books by The Most Venerable Pa-Auk Tawya Sayadawgyi:** `mindfulness-of-breathing.html`, `the-only-way-for-realization-of-nibbana.html`.
- **玛欣德尊者译著 / Dhamma Books authored or translated by Venerable Mahinda:** `the-requisites-of-enlightenment.html`, `zhiguan-fayao.html`, `the-buddhas-twelve-kinds-of-evil-retribution.html`.

The shared reader JavaScript v1.3.1 identifies these five filenames, adds `body.db-standard-contents`, and refreshes their existing shared CSS link to `?v=1.3.1`. Book HTML files remain byte-for-byte unchanged. Both language editions use the same cream panel, pale heading/group backgrounds, brown headings, solid warm borders, 10 px panel corners, and consistent row spacing. Contents headings are 22 px desktop / 20 px mobile; entries 18 px / 17 px; page numbers 14 px. Language fonts, natural title wrapping, subsection indentation, and right-aligned page numbers are retained. All contents remain one column; the title/page-number cells inside each row do not represent two contents columns.

This change is styling only: original contents entries/targets, book wording, reading flow, language switching, main-text styles, PCED, screen headers, bookmarks and search are retained. The opt-in does not affect other categories or Daily Chants Burmese. The wider continuous-reading implementation status above remains a separate audit item.


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
- Keep book text, language-specific typography, contents styling, PCED, search and bookmarks.
- Scope remains Dhamma-Books only. Daily Chants Burmese retains its existing exception.

This rollout adds The Only Way for the Realization of Nibbāna, Paccayaniddeso (English/Chinese), and The Requisites of Enlightenment / 《觉悟资粮——菩提分手册》. The approved pilot files remain unchanged.

Implementation: these four reader files load `dhamma-books-language-navigation.js?v=1.0.0` after their existing scripts. The two combined readers receive English / 中文 index links using `?lang=en` and `?lang=zh`; explicit entry selection overrides the saved language and opens the cover. Their existing in-book buttons preserve the current semantic section. Cover and contents also match across languages. Where Requisites has edition-specific material, use the nearest preceding shared section (or nearest following shared section when none precedes it). These are section-level matches, not claims of sentence-level alignment.

Paccayaniddeso receives English / 中文 header buttons. Switching transfers the current visible passage or section ID through the URL fragment and restores it below the header after load. Above the main reader, switching opens contents.

Validation and deployment status are recorded with the rollout pull request. The user's pilot approval is separate from validation of these newly added books.


Rollout validation: JavaScript syntax passed; all 39 Paccayaniddeso navigation candidates exist in both editions; 354 semantic-section positions across both combined readers resolve in both directions, including cover, contents and edition-only fallback. Every existing reader HTML byte is retained apart from the added script include. Chromium is still unavailable in this workspace, so these new books require live visual checks after deployment.



### Language-navigation corrections — 7 September 2026

Follow-up to PR #21: The Only Way now uses 49 explicitly paired English/Chinese headings rather than broad chapter/page labels. The final position restoration runs after the original language handler's deferred scrolling. Switching returns to the corresponding shared subsection heading; edition-specific subsections use the preceding shared heading. This is not sentence-level alignment.

Both Paccayaniddeso headers contain English and 中文 links in the HTML, enhanced to passage-preserving buttons by the navigation script. Hide the redundant Reader / 阅读 control while retaining its element for existing reader code. Insert the language group beside the existing reader controls. Requisites index choices place 中文 before English. All four affected readers use navigation version 1.0.1.

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


### Mobile PCED popup visibility — 10 September 2026

`pced-popup-standard.js` v1.3.10 keeps PCED dictionary popups clear of fixed or sticky book headers. On mobile, it measures the actual rendered screen-header height and opens the popup immediately below the complete visible header. Long definitions are constrained to internal scrolling within the dynamic viewport space that remains below the header. The selectors are limited to the supported PCED modal IDs: `dictModal`, `lookupModal`, and `pced-modal`.

The offset is recalculated when the popup opens and when the layout or visual viewport resizes. The popup remains movable and continues to reopen at the beginning. Desktop positioning, dictionary data, matching logic, result order, book text, footnotes and reader controls are unchanged. Static validation confirms the dynamic header-offset and remaining-height rules and the existing PCED script reference in 《佛陀的十二种恶报》; live mobile interaction remains to be checked after deployment.


### Dhammapada Nissaya and footnote popup interaction — 11 September 2026

`pced-popup-standard.js` v1.3.11 adds behaviour gated to `dhammapada-pali-chinese.html`. The Nissaya/依词释 popup opens one rendered body-text line below the measured fixed or sticky screen header on desktop and mobile, uses the remaining viewport space for internal scrolling, and remains movable. A footnote selected inside an open Nissaya popup is raised above it; closing that footnote leaves the Nissaya popup open.

Dhammapada's PCED, footnote, bookmark and Nissaya popup overlays no longer dim the main reading text, while their panels remain opaque and readable. Across Dhamma-Books, Chinese footnote popup titles are normalised from `注释` to `註释` without changing ordinary book text. Book HTML, translations, footnotes and PCED data are unchanged.

`pced-popup-standard.js` v1.3.12 also keeps the exact Dhammapada popup opener highlighted while its popup is open: the selected Pāli word for PCED, the selected footnote superscript, or the selected Nissaya button. Each popup owns its highlight, so a footnote opened over Nissaya adds a second highlight and closing it restores the still-highlighted Nissaya context underneath. Closing a popup removes only its own highlight. This behaviour is gated to Dhammapada and does not alter other books, search highlighting, popup positioning, dictionary matching, or book content.


### Stable Dhammapada Contents navigation and shared mobile popup dragging — 11 September 2026

`pced-popup-standard.js` v1.3.13 explicitly handles the 37 existing Dhammapada Contents links. Each valid fragment target is aligned below the measured complete screen header, then briefly realigned while initial fonts, preceding lazy embedded images and the page height settle. Automatic correction stops after five seconds or as soon as the reader deliberately scrolls or touches elsewhere. The link targets and book HTML remain unchanged.

The same version makes popup movement a shared Dhamma-Books standard. Movable PCED, footnote, bookmark and book-specific popups use pointer capture for mouse and one-finger dragging, plus a touch fallback for older browsers. Title-bar dragging suppresses page movement; popup-body scrolling remains available. Dragged coordinates override book-specific mobile centring rules, preserve the complete mobile book header, and keep enough title bar visible to recover or close the popup. Reopening restores the popup's documented default position. `dhamma-books-reader-standard.js` v1.3.6 first bootstrapped this movement-only support for Daily Chants Burmese because that reader has no PCED popup script; the bootstrap remains in use after its later interface conformance update. Popup content, lookup logic, stacking and other books' navigation remain unchanged.


### Shared last-opened-on-top popup stacking — 11 September 2026

`pced-popup-standard.js` v1.3.14 replaces fixed popup-type priority with one shared runtime stack across Dhamma-Books. Every newly opened or content-refreshed PCED, footnote, bookmark, Nissaya or supported book-specific popup receives the top active layer. Closing it removes only that popup and reveals earlier popups without changing their positions or state. This supports arbitrary nesting, including Dhammapada Nissaya → footnote → PCED, and preserves each popup's independent selection highlight, dragging, scrolling, default placement and overlay treatment.

The active layer is applied inline with important priority, so legacy book-specific `z-index` rules cannot place a newer popup underneath an older one. The former Dhammapada-only nested-footnote layer is retired. `dhamma-books-reader-standard.js` v1.3.7 requests popup standard v1.3.14 when bootstrapping movement and layering support for readers without their own PCED script. Book HTML, popup content, footnotes and PCED data remain unchanged.


### Mindfulness of Breathing reader-interface conformance — 11 September 2026

`mindfulness-of-breathing.html` now follows the approved screen-header, scrolling Contents and popup standards in both its English and Chinese editions. The final header is present in the initial HTML, so an old header, duplicate controls, incorrect order or temporary desktop layout cannot appear while JavaScript loads. The desktop header is fixed and non-wrapping; the mobile header remains one complete two-row unit, with Search on the second row. Chinese is listed before English, and one Book Mark window replaces the two legacy bookmark buttons while retaining separate multilingual reading positions.

The English `Content` and Chinese `目录` panels are also present in the initial HTML. Each uses one rounded frame, a non-scrolling title/Expand-Collapse row and the standard fixed-height one-column entries window, with internal scrolling on both desktop and mobile. PCED, footnote and bookmark popups use the current shared below-header positioning, internal scrolling, mouse and one-finger movement, and last-opened-on-top behavior. Book wording, translations, covers, paragraph order, language correspondence, headings, Pāli treatment, footnotes and PCED data are unchanged. The book now loads shared stylesheet v1.3.10 and reader JavaScript v1.3.10; the popup runtime remains v1.3.15.

### Automatic last-read control retirement — 11 September 2026

Last Position, Last Read, Previously Read and equivalent automatic-return controls are retired from the Dhamma-Books reader standard for every language and book. Readers must not track page scrolling solely to maintain an automatic last-read position. Book Mark remains the reader-controlled way to save and return to positions. Mindfulness of Breathing, Dhammapada, 《佛陀的十二种恶报》, 《止观法要》, 《辨析道》 and both language editions of 《觉悟资粮》 are updated under this decision; the remaining books require a later repository-wide rollout. Dhammapada, 《佛陀的十二种恶报》 and 《止观法要》 still determine the current reading position when the reader deliberately saves a bookmark, but they no longer track scrolling or unloading in the background.


### 《佛陀的十二种恶报》 reader-interface correction — 11 September 2026

`the-buddhas-twelve-kinds-of-evil-retribution.html` now presents the correct final screen header directly in its initial HTML. The desktop header is fixed, full-width, non-wrapping and contains, in order, the logo and book name, `目录`, A−, A+, `书签`, and Search. The complete mobile header remains one sticky two-row unit, with the same controls on the first row and Search on the second. The retired `上次阅读` control and its automatic scroll/unload position tracking are removed; manual bookmark saving still determines the current position only when the reader chooses to save it.

The book-specific header rules keep its established `书签` and Search controls visible after the shared reader script initializes, preventing the desktop controls from disappearing and keeping the same control set on desktop and mobile. The mobile brand area also reserves sufficient width for the complete Chinese book name without displacing Search from its second row.

The one-column `目录` panel keeps its title and `收起` / `展开` control outside the scrolling entries. Its entries now use the standard fixed internal height on both desktop and mobile, so the Contents itself scrolls on either screen size while the main book text continues below it. The book loads shared stylesheet v1.3.10, reader JavaScript v1.3.10 and popup runtime v1.3.15. Popup overlays remain transparent, so the reading text behind a popup is never dimmed. Book wording, cover, illustrations, paragraph order, headings, Pāli treatment, footnotes, search results, saved bookmarks and PCED data are unchanged.


### Repository-wide screen-header typography and button alignment — 11 September 2026

All reader screen headers use one shared multilingual sans-serif font stack for the book name, Contents and language labels, font-size controls, Book Mark, Search field and Search button. Book names and button labels retain a consistent bold treatment, while Search input text and placeholders use regular weight. This prevents book-specific body fonts from changing the screen-header wording.

Every header button and button-like link now centres its wording vertically and horizontally through shared flex alignment, centred text and a consistent line height. Shared stylesheet v1.3.10 also declares the font directly on the higher-priority button/link rule, preventing linked controls such as `目录` from retaining a different legacy serif font while native buttons use the shared sans-serif font. The rule applies to all 15 reader HTML files; each file uses the new versioned stylesheet URL so deployed browsers request the update instead of retaining an older cached copy.


### 《止观法要》 reader-interface conformance — 11 September 2026

`zhiguan-fayao.html` now follows the approved screen-header, Contents-window and popup standards. Its desktop header is fixed and shows the complete required control sequence; its mobile header is one sticky two-row unit with the reader controls on the first row and Search on the second. Book-specific visibility rules prevent the shared enhancement from hiding the established `书签` or desktop Search controls. The former separate save/open bookmark buttons are consolidated into one `书签` control, with `在此处保存书签` inside the existing bookmark popup. The retired `上次阅读` control and its automatic scroll/unload position tracking are removed on desktop and mobile. Manual bookmark saving, Search, font-size controls and stored bookmark data are preserved.

The existing one-column Contents entries are placed in a fixed-height internal scrolling window below a non-scrolling `目录` / `收起` title row. The standard desktop and mobile heights, Expand/Collapse behavior, font resizing and below-header link offsets are applied without changing any entry, page number or destination. PCED, footnote and bookmark popups load the current versioned shared runtime for mobile below-header positioning, internal scrolling, mouse and one-finger movement, last-opened-on-top stacking and transparent overlays. Footnote popup titles use `註释` and the shared lighter, smaller header treatment. Book text, translations, paragraph order, images, headings, footnotes and PCED data are unchanged.


### Repository-wide popup background standard — 11 September 2026

All Dhamma-Books popup overlays are transparent so opening PCED, footnote, bookmark, Nissaya or another supported popup never dims the reading text behind it. Popup panels remain opaque and readable, retaining their established border, shadow, close behaviour, movement, internal scrolling and last-opened-on-top order. The current shared stylesheet is v1.3.20, the reader runtime is v1.3.18, and `pced-popup-standard.js` is v1.3.16.


### 《觉悟资粮》 bilingual reader-interface conformance — 11 September 2026

`the-requisites-of-enlightenment.html` now follows the approved screen-header and content-page standard in both English and Chinese. The final header is present in the initial HTML in the required order: logo and active-language book name, Contents, Chinese then English, A−, A+, one Book Mark control, Search field and Search button. It is fixed and non-wrapping on desktop and remains one complete sticky two-row unit on mobile. A synchronous header bootstrap applies the previously selected language before the large self-contained book finishes parsing, preventing the legacy header, duplicate controls, incorrect order or temporary desktop layout from flashing. The former two legacy bookmark buttons and `上次阅读` / Last Position control are removed, and automatic scroll-position tracking is retired. Existing reader-controlled legacy bookmark data is imported into the shared Book Mark window when needed.

The English `Content` and Chinese `目录` panels now each have one rounded outer frame, a non-scrolling title and Expand/Collapse row, and a one-column internal entries window using the standard desktop and mobile heights. The screen-header Contents button expands the active panel before moving to it, and the measured header height keeps Contents destinations visible. Search and font controls follow the active language, and font changes resize Contents as well as reading text. PCED, footnote and bookmark overlays remain transparent while their panels remain opaque, movable and internally scrollable; Chinese footnote titles use `註释`. Book wording, translations, covers, paragraph order, headings, Pāli treatment, footnotes and PCED data are unchanged. The book loads shared stylesheet and reader JavaScript v1.3.11 and popup runtime v1.3.15.


### 《辨析道》 reader-interface conformance — 11 September 2026

`patisambhidamagga.html` now presents the final standard screen header directly in its initial HTML, preventing a legacy or duplicate control set from flashing while JavaScript loads. The desktop header is fixed, full-width and non-wrapping; the complete mobile header remains one sticky two-row unit. Its order is logo and book name, `目录`, A−, A+, one `书签` control, Search field and Search button. All header wording uses the shared multilingual sans-serif font, and every button label is centred vertically and horizontally.

Its cover card now uses the Daily Chants English visual standard: a warm cream gradient, light brown border, 14 px rounded corners, soft shadow and balanced padding. The original 《辨析道》 cover remains on the left and its original title, edition, translator, publisher and credits remain on the right on desktop and mobile. This cover-only change does not alter Paṭisambhidāmagga's approved 1180 px wider-reader container or its side-by-side Pāli–Chinese reading body.

The retired `上次阅读` control and background scroll tracking are removed. The shared Book Mark window supports add, list, go and delete, and imports existing reader-controlled 《辨析道》 bookmarks without deleting their legacy stored values. The `目录` title now uses Chinese only and stays visible with its `收起` / `展开` control above a one-column entries window. Entries scroll internally at the standard desktop and mobile heights, while the main text continues immediately below the Contents panel. Font controls resize the Contents as well as the reading text.

Footnote, PCED and bookmark overlays remain transparent so they never dim the book text, while their panels remain opaque, movable, independently scrollable and last-opened-on-top. Chinese note titles use `註释`. The book loads shared stylesheet v1.3.13, reader JavaScript v1.3.14 and popup runtime v1.3.16. Its established side-by-side Pāli–Chinese reading body, wording, cover image, front matter, paragraph order and alignment, footnotes, Pāli treatment and PCED data are unchanged.

Deployed mobile testing exposed that the first conformance pass had constrained only `<body>` and had left the mobile header row with visible horizontal overflow. The v1.3.13 correction applies the complete approved containment pattern: both `<html>` and `<body>` are bounded to the layout viewport; the sticky header and its inner row cannot widen or scroll sideways; main, reading and Contents containers may shrink within the viewport; and genuinely wide tables remain inside their own horizontal scrollers. The mobile cover is also kept on the left beside its title and edition information as required by the cover standard. Source checks confirm these rules and preserved content; physical-device confirmation remains pending after deployment.

### The Only Way reader-interface conformance — 11 September 2026

`the-only-way-for-realization-of-nibbana.html` now carries the final bilingual screen header in its initial HTML: logo and title, Contents, Chinese then English, A−, A+, one Book Mark, and Search. The saved English or Chinese state is applied synchronously before the large self-contained file finishes parsing, preventing an old-language header or reading panel from flashing on entry. The desktop header is fixed in one non-wrapping row; the complete mobile header stays together as one sticky two-row unit, with Search on the second row and root-level width containment.

Both the English `Content` and Chinese `目录` are one-column panels with one outer frame, a fixed title and Collapse/Expand row, and independently scrolling entries at the standard desktop and mobile heights. Legacy Save Bookmark, Go Bookmark and Last position controls and automatic last-read tracking were removed. Existing deliberate legacy bookmarks can be imported into the shared Book Mark window. Search, language correspondence, font controls, transparent popup overlays, popup movement and stacking, footnotes and PCED lookup remain available. The shared stylesheet is v1.3.15, the reader runtime is v1.3.16 and the popup runtime is v1.3.16. Book text, translations, embedded images, paragraph order, heading hierarchy, Pāli treatment, footnotes and PCED data were preserved. Source validation passes; deployed physical-device verification remains pending.

### Desktop reading-page width standard — 11 September 2026

Desktop page width now has two documented categories. The existing wider widths are retained for the readers with two-column bodies: 《辨析道》, Daily Chants English, Paccayaniddeso English and Chinese, and Pāḷi Chanting Book English, Chinese and Burmese. This classification concerns the reading body; Contents panels remain one column under the Contents standard.

Every other book uses the width of 觉悟资粮: a centred reading page with a maximum width of 1080 px and at least 14 px clearance on each side of a narrower browser. The Only Way English and Chinese panels now use this width. Its accidental desktop-wide `max-width:100%` override was removed; mobile sizing, containment, header, Contents and popup behaviour were not changed.

Further mobile testing found that the browser could remove the sticky header from view when PCED locked the book page. Popup runtime v1.3.16 now records the complete rendered header height before the Pāli-word action, holds that header fixed above the popup for the duration of the page lock, positions and constrains the movable popup below it, and restores the normal sticky header after the last PCED popup closes. The overlay remains transparent and the popup panel remains opaque and independently scrollable.

The standard now includes a mandatory full-conformance procedure. A request to change a book according to the standard requires an audit of the initial HTML, shared assets and conflicting legacy rules; viewport testing at 320, 360 and 412 CSS pixels plus desktop; explicit root/body `scrollWidth` checks and an actual swipe test; feature and content-integrity validation; cache-version updates; and honest reporting when rendered or physical-device verification is unavailable. Source-only checks must not be reported as proof of complete visual conformance.

### Daily Chants Burmese conformance and book-heading standard — 11 September 2026

`daily-chants-burmese.html` now contains its final Burmese screen header directly in the initial HTML: logo, book name, `မာတိကာ`, A−, A+, one `စာညှပ်`, Search field and Search button. The desktop header is fixed in one row; the complete mobile header is one sticky two-row unit with Search on the second row. The former separate Save/Go bookmark buttons, Last Read control, and automatic last-read tracking are removed. If the reader previously saved a deliberate legacy bookmark, it is imported into the shared Book Mark window.

Daily Chants Burmese is not one of the documented two-column wide-page exceptions. Its desktop reader therefore follows 觉悟资粮 at a centred 1080 px maximum with at least 14 px side clearance. Its Burmese-only Contents title remains fixed above the internally scrolling list, and A−/A+ resize both Contents and reading text.

The Mindfulness of Breathing `INTRODUCTION` treatment is now the documented book-text heading standard: primary chapter and major-section headings use centred text on a pale `#F4E8DF` panel with a 4 px `#A8734F` top rule and rounded corners; subordinate headings are left aligned with secondary-brown text and a thin bottom divider. Hierarchy follows the source Contents and typography, Pāli inside headings inherits the heading colour, and exceptional source-faithful illustrated title layouts remain unchanged. Daily Chants Burmese applies this hierarchy to its `h2` and `h3` section headings while preserving its printed-page exceptions, wording, images, source-page order and footnotes. It loads shared stylesheet v1.3.16 and reader runtime v1.3.17.

### Daily Chants English conformance and Chanting Book title-row standard — 12 September 2026

`daily-chants.html` now contains its final English screen header directly in the initial HTML. It retains Contents and English navigation and follows the approved order with A−, A+, one Book Mark control, Search field and Search button. The desktop header remains fixed in one row; the complete mobile header remains one sticky two-row unit with Search on the second row and no sideways document movement. The retired Previously Read control is hidden from the initial layout and automatic last-read tracking is removed.

The approved wider 1500 px desktop page width and the side-by-side Pāli–English reading body are unchanged. The `Content` panel now has one rounded outer frame, a non-scrolling Collapse/Expand title row and one internally scrolling Contents column at the standard desktop and mobile heights. A− and A+ resize the Contents as well as the reading text.

For every book in **Chanting Book 念诵本**, except Daily Chants Burmese, a separate `Pāli | English`, `Pāli | Chinese` or equivalent language-label row is not displayed above the main text. The sutta-name row is centred and uses the approved pale `#F4E8DF` panel, 4 px `#A8734F` top rule, rounded corners and brown heading text. This heading rule does not change the language columns in the reading body. Daily Chants English implements the rule; the other Chanting Books adopt it when they are next audited. Daily Chants English disables CSS multi-column flow for the complete Contents list, every Contents group and each group list, using normal full-width block flow so entries scroll vertically without creating overflow columns or a horizontal scrollbar; its Pāli–English reading body remains two columns. It loads shared stylesheet v1.3.20, reader runtime v1.3.18 and popup runtime v1.3.16. Book wording, translations, cover, Contents destinations, paragraph order, footnotes and PCED data remain unchanged.
