# Dhamma-Books Reader Interface Standard

**Status:** Approved standard for every current and future reader book in `PAMCSG/Dhamma-Books`  
**Approved reference implementation:** `dhammapada-pali-chinese.html`  
**Behaviour reference:** `daily-chants-burmese.html`  
**Last consolidated:** 25 September 2026

This is the normative interface standard for improving an existing book or adding a new book. Apply it one book at a time. Do not change book wording, translations, paragraph order, images, tables, footnotes, PCED data or unrelated styling merely to make the interface conform.

## 1. Required shared assets

Every reader book must load the current versions of:

- `dhamma-books-reader-standard.css`
- `dhamma-books-reader-standard.js`

Every reader using the repository-wide standard cover card must also load `dhamma-books-cover-width-standard.css` after its legacy and book-specific style blocks and use `db-book-cover-standard` on the body. Every reader must use `db-page-standard-width`; readers whose legacy or book-specific rules can override the common width must load `dhamma-books-page-width-standard.css` last. The retired `db-page-wide-reader` classification must not be used.

When a shared asset changes, update its versioned URL in each affected HTML file so deployed browsers do not reuse an older cached copy.

The final header structure must be present in the initial HTML and styled correctly on the first paint. JavaScript may enhance the existing controls, but it must not briefly show an old or duplicate header and replace it after loading. There must be no old-header flash when first entering a book.

The optional Read Aloud control is a progressive enhancement and may be inserted by the shared Read Aloud module after A+. Its absence before the module loads is not an old-header flash. The module must never create a duplicate control.

## 2. Screen header

### Control order and alignment

Use this exact left-to-right sequence:

1. Logo
2. Book name
3. Contents button
4. Language button or buttons, when the book has more than one language
5. A−
6. A+
7. Read Aloud, when the book supports speech
8. Book Mark
9. Search field
10. Search button

All controls, fields and rows are left-justified. Do not use a flexible spacer to push some controls to the right.

Labels must follow the active book language. For example, Chinese books use Chinese control labels and Burmese books use Burmese control labels. Language buttons appear only when applicable.

### Desktop

- Keep the complete header fixed at the top while the book scrolls.
- Keep every item in one non-wrapping row.
- Do not allow the header row to scroll sideways.

### Mobile

Follow the behaviour of Pāli Chanting Burmese and Daily Chants Burmese:

- The complete header is one sticky unit and remains at the top while the book scrolls.
- The first row contains the logo, book name, Contents, language buttons when applicable, A−, A+, Read Aloud when supported, and Book Mark.
- The second row contains the Search field followed by the Search button.
- The two rows stay together; the first row must never scroll away while only the Search row remains visible.
- The Search row occupies the available viewport width without extending beyond it.
- The page, header and book body must not slide left or right during normal unzoomed one-finger scrolling.
- Preserve native two-finger pinch-to-zoom. Do not use `user-scalable=no`, a restrictive `maximum-scale`, or touch rules that disable zooming.

Use `overflow-x: clip` or an equivalent layout-width correction at the document level so accidental horizontal layout overflow does not create a competing scroll container or break sticky positioning. Tables or other genuinely wide components may have their own contained horizontal scroller, but must not widen the whole page.

### Header appearance

Use the displayed Daily Chants English screen header as the visual reference for every current and future Dhamma-Books reader. Book-specific headers must retain their own title, available language buttons and language-appropriate labels, but must not substitute a smaller or differently shaped desktop header.

| Element | Standard |
| --- | --- |
| Background | `#A8734F` |
| Desktop inner row | Full viewport width; 8 px vertical and 12 px horizontal padding; 8 px gap |
| Logo tile | White 44 × 50 px tile; 8 px rounded corners; 31 × 42 px contained emblem |
| Text | White |
| Font family | `Arial`, `Microsoft YaHei`, `PingFang SC`, `Noto Sans CJK SC`, `Noto Sans SC`, `Noto Sans Myanmar`, `Myanmar Text`, `sans-serif` |
| Title font size | 18 px desktop; 16 px mobile |
| Control font size | 14 px desktop; 12 px mobile |
| Desktop controls | At least 40 px high; 9 px rounded corners; translucent white background and border; active control has a white background with brown text |
| Search input and placeholder | At least 15 px on mobile |

Use this same shared font stack for every wording in the screen header, including the book name, Contents, language labels, A−, A+, Book Mark, Search input and Search button. Apply it with equal priority to native `<button>` controls and button-like `<a>` links so, for example, a linked Contents control cannot retain a different legacy font. The book name and button labels are bold; Search input text and its placeholder are regular weight. Do not allow book-specific fonts to override the shared header font.

Centre every button label and every button-like header link both vertically and horizontally. Implement this on the control itself with flex alignment (`align-items: center` and `justify-content: center`), centred text and a consistent line height; do not rely on unequal padding to make a label appear centred.

Controls must remain large enough to tap. Compact mobile spacing is permitted only when the controls remain legible and functional.

Follow the displayed Daily Chants English state treatment: Contents is a navigation action and must retain the normal translucent header background; it must not remain white after being selected. In every multilingual book, only the button for the edition currently displayed has the white active background with brown text. The other language buttons and the Contents button retain the translucent background. Mark the current language in the initial HTML with `aria-current="page"` and an active class so the correct state is visible on first paint, and preserve the same state when JavaScript enhances links into buttons. An enhanced current-language button must expose `aria-pressed="true"`.

## 3. Font-size controls

- A− and A+ must work with touch as well as mouse input.
- Each press must visibly resize the active book text.
- They must also resize the Contents heading and Contents entries.
- Do not hard-code descendant font sizes in a way that prevents them from following the book's font-size setting.
- Preserve the selected size consistently while the reader remains in use, according to the book's established storage behaviour.

## 3A. Read Aloud standard

### Approved behaviour pattern

`mindfulness-of-breathing.html` is the approved reference for a multilingual book containing English or Chinese prose with inline Pāli terms. A structurally similar book, including `the-only-way-for-realization-of-nibbana.html`, must reuse this pattern. Do not create a new book-specific voice rule merely because the title, paragraph classes or quantity of Pāli vocabulary differs.

The shared implementation consists of:

- `dhamma-books-read-aloud-standard.js` for the stored settings and Pāli voice/fallback profile;
- `dhamma-books-read-aloud-universal.js` for the controls, readable blocks, selection, highlighting and speech sequence; and
- `dhamma-books-read-aloud-books.css` for the control and panel appearance and each header's explicit control order.

When any of these shared files changes, update the versioned URL in every affected book. Never reuse the same cache version for changed code.

### Header position

The Read Aloud button is inserted immediately after A+ and before Book Mark. Every supported book must define an explicit flex order for the dynamically inserted button and, when necessary, increment the existing Book Mark and Search orders. The final sequence is always:

`A− → A+ → Read Aloud → Book Mark → Search`

Verify this order on desktop and mobile after the module has loaded. A dynamically inserted control with an unspecified default order is a defect.

### Voice assignment

Assign voices by the semantic language of each text run, not merely by the presence of a Pāli diacritic somewhere in its containing paragraph.

| Visible text | Required voice |
| --- | --- |
| Ordinary English text | Selected English voice |
| A marked inline Pāli term inside English prose | Selected Pāli voice |
| A fully Pāli passage | Selected Pāli voice |
| Ordinary Chinese text | Selected Chinese voice |
| A marked inline Pāli term inside Chinese prose | Selected Pāli voice |
| Burmese text | Selected Burmese voice |

For a mixed English–Pāli paragraph, first classify the paragraph as English when meaningful English remains after marked Pāli spans are removed. Then split its text nodes into English and marked-Pāli speech runs. Do not classify the complete paragraph as Pāli simply because it contains `.pali-word` elements or Pāli diacritics. Do not force the complete mixed paragraph through one English voice either. Apply the corresponding rule to Chinese–Pāli and Burmese–Pāli text.

The `Read Pāli text` setting controls fully Pāli passages. Selecting `No` must not omit an English, Chinese or Burmese paragraph merely because that paragraph contains inline Pāli terms.

### Starting point and selected text

- `Start from Here` / `从此处开始` begins at the first word actually selected and continues through the remaining readable text in document order. It must not return to the beginning of that sentence or paragraph.
- `Read Selected Text` / `朗读所选文字` reads only the exact selected text.
- Opening the Read Aloud panel must not discard an existing selection.
- While reading from a selection, keep that selection visible and preserve it where the browser permits.
- Highlight the passage currently being spoken, and scroll only when that passage is outside the visible reading area. Do not move the book to an unrelated location.
- If a selected block is excluded from the normal sequence, continue with the next readable block rather than falling back to the beginning of the book.

### Language switching and saved voices

Every book's actual language controls must trigger a Read Aloud refresh. This includes book-specific IDs such as `#langEn` and `#langZh`, not only generic `.lang-button` or `[data-lang]` controls. After a language change:

- panel labels follow the active interface language;
- the ordinary voice list contains voices for the active book language;
- the previously selected voice for that language is restored when available; and
- the saved Pāli voice remains independent of the English, Chinese or Burmese voice.

### Burmese online voices

Every Burmese book using Read Aloud uses the shared Cloudflare-to-Azure Speech service rather than depending on a Burmese voice being installed on the reader's device. The ordinary Burmese voice menu must provide both supported Azure voices:

- `my-MM-ThihaNeural` — male; the default Burmese voice;
- `my-MM-NilarNeural` — female; available as an alternative.

The Azure subscription key remains only in the encrypted Cloudflare Worker secret. It must never be committed to the repository, embedded in a book, shown in a screenshot or sent in chat. Pāli passages remain controlled separately by the Pāli voice setting.

### Closing the panel

Closing the Read Aloud panel—either with its × button or by pressing the header Read Aloud button again—must immediately pause active reading. It must not continue speaking while its controls are hidden. Reopening the panel shows the paused state and permits the reader to resume, stop or restart.

### Consistency and non-regression rule

Before adding a book-specific condition, compare the book's structure with an already approved reference. If the same semantic pattern exists, reuse the same classifier and speech-run logic. A book-specific exception is permitted only when the DOM structure genuinely cannot be represented by the shared configuration; document the reason beside the exception.

For every Read Aloud change, test at least:

- [ ] icon order on desktop and mobile;
- [ ] an English-only sentence;
- [ ] an English sentence containing one or more marked Pāli terms;
- [ ] a fully Pāli passage with `Read Pāli text` set to both `No` and `Yes`;
- [ ] Chinese or Burmese prose when present;
- [ ] switching languages while the Read Aloud panel is open;
- [ ] closing the panel pauses speech and reopening it permits Resume;
- [ ] Burmese books default to Microsoft Thiha and also offer Microsoft Nilar;
- [ ] `Start from Here` from the middle of a sentence;
- [ ] `Read Selected Text` with an exact partial selection;
- [ ] current-passage highlighting and scrolling; and
- [ ] JavaScript syntax, cache-version changes and the amended-files ZIP.

## 4. Contents panel

Use Daily Chants Burmese as the structural reference.

### Structure

- Use one rounded outer frame only.
- Do not place a second frame around the list or around individual Contents groups.
- Put the Contents title row outside and above the scrolling entries window.
- The title row must never cover an entry as the Contents list scrolls.
- Centre the Contents title horizontally in the full width of the panel. The title must remain truly centred independently of the Expand/Collapse button at the right; do not centre it only within the space left over beside that button.
- Place an Expand/Collapse button in the title row.
- The screen-header Contents button must expand the panel when necessary and then move to it.
- Only the entries scroll inside the fixed-height window; the Contents title row stays visible above them.

### Title wording

| Book language | Panel title |
| --- | --- |
| Chinese | `目录` only |
| English | `Content` only |
| Burmese | Use the approved Burmese Contents label already established for that book |

Do not combine two languages in the title, such as `Contents · 目录`, unless a later book-specific requirement expressly asks for it.

### No printed page numbers in a standard HTML reader

Do not display printed-book page numbers or Roman-numeral front-matter page numbers in the HTML Contents or ordinary reading body. HTML is reflowable, and Contents links already take the reader directly to the corresponding section, so printed page numbers are misleading and unnecessary. Omit the Contents page-number column, dot leaders, numbers appended to Contents titles, visible `Source page` labels, repeated `Pāli · page` / `Chinese · page` labels and other decorations created only by a printed page turn. Source-page references may remain privately in `data-*` attributes for conversion checking, but they must not break or label the visible reading flow. Display them only in an expressly requested source-comparison or proofreading mode.

Content under the same title must flow continuously in HTML. A printed page break must not create a new card, repeated column heading, large gap or artificial section boundary. Begin a new visual section only when the source begins a new semantic title or heading.

### Size

The entries window uses the Daily Chants Burmese height plus approximately one normal Contents-entry row:

- Desktop: `calc(52vh + 3.2em)`
- Mobile: `calc(46vh + 3.2em)`

### Colours

| Element | Colour |
| --- | --- |
| Title-row background | `#F4E9DF` |
| Title text | `#66442F` |
| Contents panel | `#FFFDF9` |
| Main entry text | `#302A26` |
| Borders and row separators | `#DFCBBB` |
| Muted auxiliary text | `#7B685A` |
| Section/group highlight bar | background `#EEE1CF`; text `#633919` |

Every non-clickable section or group heading inside the scrolling Contents entries uses the Dhammapada highlight-bar treatment: a rectangular `#EEE1CF` bar beginning exactly one character-space (`1em`) from the left edge of the scrolling Contents window, with bold, left-aligned `#633919` text, no rounded corners or separate frame, and `10px 16px` internal padding (`10px 14px` on mobile). The bar fills the remaining width to the right after that `1em` inset. Its font size must remain relative to the Contents font size so A− and A+ resize it. This group-heading bar is distinct from the fixed Contents title row.

Keep each book's existing clickable Contents-entry fonts, hierarchy, colours and styling. Apart from the title row, section/group highlight bar, fixed scrolling window and removal of inner frames, do not restyle the actual entries merely for standardisation.

### Columns and reading flow

- Every book uses one Contents column on desktop and mobile, including books in the Chanting Book 念诵本 category.
- Main text follows the Contents panel continuously on the same page.
- Contents links land below the sticky/fixed screen header so the destination heading remains visible.

## 5. Desktop page width

Every Dhamma-Books reader follows the displayed desktop reading-page width of `daily-chants-burmese.html`, including books with side-by-side or otherwise multi-column reading bodies:

```css
width: min(1080px, calc(100% - 28px));
margin-left: auto;
margin-right: auto;
```

The page therefore has a maximum desktop width of 1080 px, remains centred and keeps at least 14 px clearance on each side when the browser is narrower. There are no wider-reader exceptions. Apply this rule to every language panel of a multilingual book and to archival or working copies of reader books.

Page width and reading-column count are separate requirements. Narrowing the page container to this standard must not merge, remove or otherwise change an established Pāli/translation or Pāli/Aṭṭhakathā reading-column layout. The one-column requirement applies to the Contents panel. Mobile width and containment continue to follow the mobile screen-header and no-sideways-movement requirements in this document.

## 6. Book-text heading hierarchy

### Chanting Book 念诵本 category rules

The following requirements apply to the complete **Chanting Book 念诵本** category:

- Every book uses one Contents column on desktop and mobile.
- The main reading text follows the Contents panel continuously on the same page.
- A book with an approved side-by-side reading body retains those reading columns inside the common Daily Chants Burmese page width; the one-column requirement applies to the Contents panel, not to the reading body.
- Except for `daily-chants-burmese.html`, do not display a separate `Pāli | English`, `Pāli | Chinese`, or equivalent language-label row above the reading text. The Pāli and translated sutta names themselves form the section heading.
- Except for `daily-chants-burmese.html`, centre the complete sutta-name row and use the approved primary-heading treatment: pale `#F4E8DF` background, 4 px `#A8734F` top rule, rounded corners and normal brown heading text. Pāli in this heading inherits the heading colour rather than body-text blue.

The sutta-name treatment changes only the heading presentation; it does not merge, narrow or otherwise change a book's side-by-side reading columns. Daily Chants Burmese retains its documented source-faithful Burmese heading treatment and is excluded only from the sutta-name-row requirements above. It remains subject to the other applicable Chanting Book, screen-header, Contents, page-width, popup and non-regression standards.

### General hierarchy

Use the heading treatment demonstrated by the approved `INTRODUCTION` heading in Mindfulness of Breathing.

- A book's primary chapter or major-section headings are prominent and centred. Use the pale panel background `#F4E8DF`, a 4 px top rule in `#A8734F`, 12 px rounded corners, normal book-heading text colour, and balanced vertical and horizontal padding.
- Subheadings use a simpler left-aligned treatment: transparent background, secondary brown text `#8F5D3B`, and a thin bottom divider `#DFCBBB`.
- Determine whether a heading is primary or subordinate from the source book's Contents hierarchy and typography. Do not classify every bold line as a primary heading.
- Heading text, including Pāli within a heading, inherits the heading colour and must not use the body-text Pāli blue.
- Heading font sizes must follow the reader's A− and A+ setting. Long headings may wrap naturally without clipping or widening the page.
- Preserve intentionally source-faithful title treatments used inside illustrations, facsimile layouts, or other exceptional printed-page reproductions.

This is the standard book-text heading hierarchy for every current and future Dhamma-Books reader. When improving a book, apply it to that book's semantic heading levels without changing the heading wording or source order.

### Source-faithful book fonts

The source file is authoritative for the typography of the book itself. Preserve its font families by semantic role and, where the source intentionally mixes fonts, by paragraph or inline run. This includes body text, quotations, headings, notes, tables, captions and front matter. The shared reader font applies only to interface chrome such as the screen header, buttons, Search fields and popup title bars; it must not replace the book-content fonts. Do not use an unscoped rule such as `body * { font-family: ... !important; }` that overrides source typography.

Use a fallback stack that starts with the source font and then names the closest Unicode-capable fonts of the same typographic category. An unavailable local font may therefore fall back while retaining Song, Kai, FangSong, Hei, serif or sans-serif character as appropriate.

An exception applies when the source uses a non-Unicode font encoding, or when conversion has been expressly requested. Convert the encoded text to correct Unicode characters and display it with a suitable Unicode font. For example, Sangayana or VriRomanPali-encoded Pāli is converted to Unicode Pāli and displayed with `Times New Roman`, `Noto Serif` or an equivalent Unicode Pāli font; the legacy encoded font and characters must not be carried into HTML.

For every conversion, record a source-to-HTML font map and verify both normal reading text and popup copies of notes. Popup construction must preserve the source element's font class or equivalent semantic font role.

### Source-faithful numbered paragraphs

Retain each numbered paragraph's actual source indentation; do not impose one universal hanging-indent template on every numbered item. If the source uses an ordinary first-line indent, the number begins at that inset and wrapped lines return to the source paragraph margin. If the source explicitly uses a hanging indent or a left-indented list, preserve that different measurement and align its continuation lines accordingly. Audit the complete book because visually similar numbered passages may use different source paragraph settings. Preserve deliberate compact spacing between consecutive numbered items and do not add blank lines merely to separate them.

## 7. Book cover

- Use the Daily Chants English cover card as the visual reference for every book: one warm cream card with `linear-gradient(135deg, #fffdf8, #f6eddf)`, a 1 px `#D8CFC3` border, 14 px rounded corners, `overflow: hidden`, and the soft shadow `0 8px 30px #5A46331C`.
- Use balanced desktop padding equivalent to 34 px vertically and 44 px horizontally, reduced responsively on narrower screens.
- Display the cover on the left and the title/edition information on the right on both desktop and mobile.
- Do not centre the cover above the text on mobile.
- Reduce the cover width and spacing responsively so the side-by-side arrangement fits the viewport.
- Allow the information column to shrink and wrap naturally; it must not force horizontal page movement.
- Keep the information left-aligned. The cover image may retain its own light border and shadow inside the card.
- The cover card fills the width available inside the common centred page container, which has a desktop maximum of 1080 px.
- Preserve the original cover image, wording, credits and metadata.
- Implement this appearance in `dhamma-books-cover-width-standard.css`, loaded after legacy book styles. The body class `db-book-cover-standard` activates the cover selectors; `db-page-standard-width` activates the common page-width rule. Load `dhamma-books-page-width-standard.css` last wherever a legacy or book-specific width needs a final override.

## 8. Search

- Search must work with touch and mouse input.
- Search only the active visible reading text.
- Highlight all matches and move to the first match.
- Report when no result is found.
- Clearing the Search field restores the previous view and reading position.
- The mobile input text and placeholder must be at least 15 px and clearly readable.
- Search controls stay on the mobile header's second row and remain fully inside the viewport.

### PCED dictionary popup

- A PCED popup must never appear behind the book's fixed or sticky screen header.
- On mobile, open the popup below the complete visible screen header so the book header remains visible and is not covered.
- Measure the actual rendered header height rather than assuming a fixed offset, because the mobile header height can vary by book, language and screen width.
- Record that rendered height before a Pāli-word action locks the page. While the mobile PCED popup is open, hold a sticky header fixed at the recorded height and above the popup layer; restore its normal sticky state when the last PCED popup closes. This prevents mobile browsers from removing the sticky header when the book page is locked.
- The complete popup header, selected Pāli word and close button must be visible when the popup opens.
- Long dictionary results use only the viewport space remaining below the book header and scroll inside the popup; their length must not push either header outside the visible screen.
- Reopening a popup starts at the beginning of its results.
- Preserve the established ability to move the popup and preserve all PCED lookup data, matching and display order.

### Popup movement

Every movable Dhamma-Books popup must support both mouse dragging on desktop and one-finger dragging on mobile. This includes PCED, footnote, bookmark and book-specific popup panels. Dragging begins only from the popup title bar; close buttons, links, inputs and other interactive controls in that bar retain their normal action and must not begin a drag.

The title bar uses Pointer Events with pointer capture and `touch-action: none`; provide a non-passive touch fallback for older browsers without Pointer Events. A title-bar drag must not scroll the underlying book page, while the popup body remains independently scrollable. Apply the dragged `position`, `left`, `top`, `width`, `margin` and `transform` with sufficient priority to override book-specific flex or mobile popup layout rules.

`pced-popup-standard.js` supplies the shared movement implementation and watches existing and dynamically created popup panels. A reader that does not otherwise load the PCED popup script must bootstrap its movement-only support through `dhamma-books-reader-standard.js`; this currently covers Daily Chants Burmese.

Constrain a moved popup so enough of its title bar remains visible to move or close it. On mobile, do not let dragging cover the complete fixed/sticky book header. Reopening the popup clears its dragged coordinates and restores that popup type's documented default position. Shared movement must not alter popup content, stacking, internal scrolling or close behaviour.

### Popup stacking

Every Dhamma-Books popup participates in one shared last-opened-on-top stack. Whenever a PCED, footnote, bookmark, Nissaya or other supported book-specific popup opens—or is reopened with newly selected content—it must move above every popup that is already open. Do not assign a popup type a permanently higher layer than another popup type.

Nested depth is unrestricted. For example, Dhammapada must support Nissaya → footnote → PCED with PCED on top. Closing the top popup removes only that popup from the stack and reveals every earlier popup in its existing position and state. Preserve independent opener highlights, movement, internal scrolling, transparent-overlay rules and default opening positions. Apply the active layer as an inline important value so old book-specific `z-index` declarations cannot override the shared order.

### Popup background

Every popup overlay in every Dhamma-Books reader must be transparent. Opening PCED, footnote, bookmark, Nissaya or another supported popup must not dim, shade or obscure the reading text behind it. The popup panel itself remains opaque and readable, with its established border and shadow. Preserve the popup's close controls, outside-click behaviour, movement, stacking and internal scrolling.

### Footnote popup wording

Use `註释`, not `注释`, as the title of a Chinese footnote popup. This terminology rule changes the popup title only; do not rewrite ordinary book text containing `注释`.

Every footnote trigger must resolve to exactly one hidden note body. The trigger and body may use different attribute names only when the popup script explicitly maps them; validate the script's selector against the generated HTML and confirm that the trigger-ID and body-ID sets are identical. A correct superscript appearance alone is not sufficient evidence that the popup works.

### Dhammapada nested popups

`dhammapada-pali-chinese.html` has a book-specific Nissaya/依词释 popup. Its default position is one normal body-text line below the complete rendered screen header on desktop and mobile. Measure the actual header height and body-text line height rather than assuming a fixed offset. Long Nissaya content scrolls internally within the remaining dynamic viewport space, and the popup remains movable.

When a reader selects a footnote superscript inside an open Nissaya popup, the footnote popup must appear above the Nissaya popup. Closing the footnote leaves the Nissaya popup open. If a Pāli word in that footnote is then selected, PCED opens above both earlier popups according to the shared popup-stacking standard.

In Dhammapada, preserve the established transparent PCED, footnote, bookmark and Nissaya overlays together with their opaque panels, close controls, outside-click behaviour, internal scrolling and movement.

While a Dhammapada PCED, footnote or Nissaya popup is open, keep the exact word, footnote superscript or Nissaya button that opened it visibly highlighted in the underlying reading surface. Remove that highlight when its popup closes. Nested popup highlights are independent: opening a footnote from Nissaya keeps the Nissaya trigger highlighted, adds a highlight to the selected footnote superscript, and removes only the footnote highlight when the footnote closes. The highlight must not change book wording, PCED matching or normal search highlighting, and this opener-highlight rule is currently Dhammapada-specific.

### Dhammapada Contents navigation

The 37 Dhammapada Contents links retain their existing unique fragment targets. Handle their navigation explicitly so the selected target is aligned 10 px below the measured complete screen header. During the first navigation after entering the book, recheck that alignment while fonts and any preceding embedded images finish loading and while the initial page height settles. Stop automatic realignment after five seconds or immediately when the reader deliberately scrolls or touches outside another Contents link. Preserve the selected URL fragment. This stability correction is Dhammapada-specific and must not change another book's Contents navigation.

## 9. Book Mark

- Provide one Book Mark header button, not duplicate legacy bookmark controls.
- The bookmark window supports add, list, go and delete, with bookmarks stored separately for each book.
- Do not provide a Last Position, Last Read, Previously Read or equivalent automatic-return control in any book.
- Do not run background scroll tracking solely to maintain an automatic last-read position.
- Book Mark destinations and Contents targets must be offset below the complete header rather than hidden behind it.

## 10. Language editions

- A multilingual book displays only the language buttons that actually exist.
- For every current and future multilingual book in Dhamma-Books, order the available language buttons as **English → Chinese → Burmese**. This sequence is mandatory regardless of the active reading language. Omit any language for which the book has no edition.
- Highlight only the currently displayed language with the white active-control background and brown text. The Contents button is not a selected language or persistent view state and retains the normal translucent header treatment, including after it is clicked. The current-language state must be correct in the initial HTML and after JavaScript enhancement.
- Switching languages should return to the corresponding passage or nearest shared heading, using semantic section identifiers rather than raw page percentages.
- Header labels, Search feedback and bookmark actions follow the active language.

## 11. Non-regression requirements

An interface-standard change must preserve:

- all book wording and translations;
- paragraph and section order;
- cover image and book illustrations;
- tables and source-page references;
- footnotes and endnotes;
- PCED word lookup and its language profile;
- Chinese-Tipiṭaka terminology integration where applicable;
- search, bookmarks and language navigation not directly being corrected;
- the book's established body typography, Pāli treatment and actual Contents-entry styling.

## 12. Mandatory full-conformance procedure and acceptance checklist

Whenever a request says to improve, correct or change a book "according to the standard documentation," treat it as a complete conformance task for that book, not as permission to copy only the most visible styling. The following procedure is mandatory:

1. Fetch and start from the latest GitHub `main`, then read this document from that revision.
2. Audit every applicable requirement in this document against the book's initial HTML, loaded shared assets, book-specific CSS and JavaScript, including legacy rules that may override or conflict with the standard.
3. Put the final header structure and first-paint layout in the initial HTML. Do not rely on delayed JavaScript replacement to correct a legacy header.
4. Test desktop and narrow mobile layouts. At minimum, test widths of 320, 360 and 412 CSS pixels plus a normal desktop width.
5. At every tested mobile width, verify `document.documentElement.scrollWidth <= document.documentElement.clientWidth` and `document.body.scrollWidth <= document.documentElement.clientWidth` before and after opening Contents and every popup type. Perform an actual one-finger horizontal swipe check; neither the header nor the document may move sideways.
6. Scroll vertically and confirm the complete mobile header remains one sticky two-row unit. Confirm the desktop header remains fixed and non-wrapping.
7. Test Contents scrolling, links, Search, A−, A+, Book Mark, popup movement, popup stacking, transparent overlays and language switching when applicable. Confirm native two-finger pinch-to-zoom remains available.
8. Compare the book text, translations, images, paragraph order, links, footnotes and PCED data with the starting revision, except for content changes expressly requested by the user.
9. Run structural and script validation, update the implementation status and version every changed shared asset in each affected HTML file.
10. Do not describe a book as fully conforming until all applicable checks pass. If rendered browser or physical-device testing is unavailable, state that limitation explicitly and mark the visual/device result as awaiting verification rather than treating source-only checks as proof of full conformance.

### Acceptance checklist

Test every improved or newly added book at desktop width and at a narrow mobile width.

- [ ] No old or duplicate header flashes on entry.
- [ ] Desktop header remains at the top in one row and follows the required sequence.
- [ ] Mobile header remains at the top as one complete two-row unit.
- [ ] Search is on the mobile second row and is fully visible.
- [ ] All header items and both rows are left-justified.
- [ ] Every header wording uses the shared multilingual font stack; book-specific fonts do not override it.
- [ ] Every button and button-like link label is centred vertically and horizontally.
- [ ] On desktop, every reader matches the displayed Daily Chants Burmese width: centred, with a 1080 px maximum and at least 14 px side clearance, while any established reading columns remain unchanged.
- [ ] Primary book-text headings use the centred pale panel and top rule; subordinate headings use the simpler left-aligned divider treatment; heading hierarchy follows the source book.
- [ ] Book text preserves the source file's fonts by semantic role or inline run; reader-interface CSS does not override them.
- [ ] Any specified non-Unicode font encoding has been converted to Unicode and uses a suitable Unicode display font.
- [ ] Footnote and other popup content retains the same source-faithful font as its hidden source content.
- [ ] A Chanting Book other than Daily Chants Burmese has no separate language-label row above the reading text, and its sutta-name rows use the centred approved heading treatment.
- [ ] Normal mobile scrolling does not move the whole page sideways.
- [ ] Two-finger pinch-to-zoom still works.
- [ ] A− and A+ resize both reading text and Contents text.
- [ ] Book Mark and Search work on mobile, and no automatic last-read control is present.
- [ ] On mobile, a PCED popup opens below the complete book header without covering it; the book header remains visible before opening, throughout popup dragging and after closing; the popup header and close button remain visible, and long results scroll internally from the beginning.
- [ ] Every movable popup can be dragged from its title bar with a mouse and with one finger; title-bar dragging does not scroll the book, popup-body scrolling still works, and enough of the title bar remains visible.
- [ ] The most recently opened or refreshed popup is always on top at every nesting depth; closing it reveals earlier open popups without resetting them.
- [ ] Every popup overlay is transparent and does not dim the reading text; every popup panel remains opaque and readable.
- [ ] In Dhammapada, Nissaya opens one body-text line below the complete header, a nested footnote opens above it, and popup overlays do not dim the main text.
- [ ] In Dhammapada, the exact PCED word, footnote superscript or Nissaya button remains highlighted while its popup is open; nested highlights clear independently when their corresponding popup closes.
- [ ] On the first Dhammapada Contents selection after entry, the correct target remains aligned below the complete header after the initial layout settles.
- [ ] Cover remains on the left on mobile without causing horizontal overflow.
- [ ] Contents uses one outer frame with no inner frame.
- [ ] Contents title row stays outside the scrolling entries.
- [ ] Contents title wording and pinkish colour pair are correct.
- [ ] Contents omits printed-book page numbers, Roman numerals and dot leaders.
- [ ] Ordinary reading text omits visible printed-page labels; printed page turns do not interrupt content under the same title.
- [ ] Every Contents section/group heading uses the standard full-width rectangular highlight bar on desktop and mobile.
- [ ] Contents height matches the standard.
- [ ] Main text follows Contents continuously.
- [ ] Contents targets and restored positions are not hidden behind the header.
- [ ] Inline scripts compile and no existing reader feature regresses.
- [ ] Only the intended book interface and documentation changed.

## 13. Implementation status

**Page-width revision, 12 September 2026:** Every width statement in the historical implementation notes below is superseded by Section 5. The former wider-reader exceptions are retired. `patisambhidamagga.html`, `daily-chants.html`, both Paccayaniddeso editions, all three canonical Pāḷi Chanting Book editions, and `pali-chanting-book-burmese-updated.html` now use `db-page-standard-width` and load `dhamma-books-page-width-standard.css?v=1.0.0` last. They match the displayed Daily Chants Burmese width while retaining their established reading columns. All other interface and content-preservation statements below remain current.

- `dhammapada-pali-chinese.html` is the approved reference implementation. Its former `上次阅读` control and automatic scroll/unload position tracking were removed on 11 September 2026. Book Mark continues to determine the current position only when the reader deliberately saves a bookmark.
- `the-buddhas-twelve-kinds-of-evil-retribution.html` was brought into full conformity on 11 September 2026. Its final header is present in the initial HTML: fixed and non-wrapping on desktop, and one complete sticky two-row unit on mobile with Search on the second row. The book-specific header rules keep its established `书签` and Search controls visible after shared reader enhancement on both screen sizes, and the mobile first row reserves enough space for the complete Chinese book name. It has no Last Position, Last Read or Previously Read control and performs no automatic last-read scroll tracking. Its one-column Contents uses the standard fixed-height internal scrolling window on desktop and mobile beneath a non-scrolling title row. Search, reader-controlled Book Mark, font controls, transparent popup overlays and current shared popup behavior are preserved. Its book content, cover, illustrations, body design, headings, Pāli treatment, footnotes and PCED integration were not changed.
- `zhiguan-fayao.html` was brought into full conformity on 11 September 2026. Its final fixed desktop header and complete two-row sticky mobile header are present in the initial HTML, and its book-specific visibility rules keep the established `书签` and Search controls visible after shared reader enhancement on both screen sizes. It has no Last Position, Last Read or Previously Read control and performs no automatic last-read scroll tracking; manual Book Mark saving determines the current position only when the reader chooses to save it. Its collapsible fixed-height one-column Contents window, font controls and popup integration follow this standard. Its PCED, footnote and bookmark popups use the shared mobile positioning, movement, last-opened-on-top and transparent-overlay behavior; Chinese footnote titles use `註释`. Its book content, cover, body hierarchy, Pāli treatment, footnotes and PCED data were preserved.
- `mindfulness-of-breathing.html` was brought into conformity on 11 September 2026. Its bilingual English/Chinese reader uses the fixed desktop and complete two-row mobile header, with English listed before Chinese, one Book Mark control and active-language Search. It has no Last Position, Last Read or Previously Read control and performs no automatic last-read scroll tracking. The final header and both one-column Contents structures are present in the initial HTML, so neither a legacy header nor a temporary layout can flash before JavaScript enhancement. Both English and Chinese Contents entries scroll inside the standard fixed-height window on desktop and mobile beneath a non-scrolling title row. Its PCED, footnote and bookmark popups use the shared below-header positioning, movement, internal scrolling and last-opened-on-top behavior. Book content, covers, language correspondence, headings, Pāli treatment, footnotes and PCED data were preserved.
- `the-only-way-for-realization-of-nibbana.html` was brought into source-level conformity on 11 September 2026. Its bilingual English/Chinese reader places the final header in the initial HTML in the required order, with English before Chinese, one Book Mark control, Search and no Last Position, Last Read or automatic last-read tracking. A synchronous saved-language bootstrap makes the correct language header and reading panel visible on first paint instead of briefly showing the other edition while the large self-contained file parses. The desktop header is fixed and non-wrapping; the complete mobile header is one sticky two-row unit with Search on the second row and document-level horizontal containment. Its English `Content` and Chinese `目录` each use one frame, a non-scrolling Expand/Collapse title row and the standard fixed-height one-column entries window on desktop and mobile. Existing deliberate legacy bookmarks are imported into the shared Book Mark window without restoring automatic position tracking. Popup overlays remain transparent and current shared popup positioning, movement, internal scrolling and stacking are preserved. A same-day width correction removed an overly broad desktop `max-width:100%` override and set both language panels to the standard-width-book reference used by 觉悟资粮: centred, with a 1080 px maximum and 14 px minimum clearance on each side. The mobile layout was not changed. The book wording, translations, covers, paragraph order, heading hierarchy, Pāli treatment, footnotes and PCED data were preserved. Source and structural checks pass; deployed physical-device confirmation remains pending. On 14 September 2026, the Chinese panel was rebuilt from the supplied 2023.11 Word source: logical paragraphs replace page-fragmented text, 30 source tables are responsive HTML tables, all 105 Contents destinations resolve, source Chinese font roles are retained, and Sangayana Pāli is Unicode. On 15 September, Word left, first-line and hanging indents were converted from the source paragraph measurements across the Chinese text. Consecutive numbering runs use their first item as the common layout model, native list continuation lines align with the item wording, and all 145 Word boxed paragraphs retain a left offset without drawing the box. All source Heading 1 paragraphs use the prominent centred main-heading treatment. Verse and quotation lines remain tightly grouped without artificial paragraph gaps or an added left rule. The note system now separates Word's 44 numeric footnotes from its 11 lettered endnotes: `尾注A`–`尾注K` and their full text are visible under `尾注`, each label returns to its corresponding superscript, and popup content is generated from the same source. Rebuilds retain exactly one `2023.11` edition date. Lower-level Chinese subheadings are enlarged without changing their hierarchy. The home card reserves a non-overlapping left column for the separate English and Chinese covers. Source-text, note-link and script checks pass; rendered-browser and deployed physical-device confirmation remain pending.
- `the-requisites-of-enlightenment.html` was brought into conformity on 11 September 2026. Its bilingual English/Chinese reader places the final header structure in the initial HTML, with English before Chinese, one Book Mark control, active-language Search and no automatic last-read control or tracking. The desktop header is fixed in one non-wrapping row; the complete mobile header stays together as a sticky two-row unit, with Search on the second row. Its English `Content` and Chinese `目录` panels each use one rounded frame, a non-scrolling Expand/Collapse title row and the standard fixed-height one-column entries window on desktop and mobile. Existing legacy bookmark data is imported into the shared Book Mark window without deleting the old stored value. PCED, footnote and bookmark overlays remain transparent, their panels remain opaque, and Chinese footnote titles use `註释`. Book wording, translations, covers, paragraph order, headings, Pāli treatment, footnotes and PCED data were preserved.
- `patisambhidamagga.html` was brought into conformity on 11 September 2026. Its final Chinese screen header is present in the initial HTML in the required order, with one Book Mark control, Search and no `上次阅读` or automatic last-read tracking. The desktop header is fixed and non-wrapping; the complete mobile header is one sticky two-row unit with Search on the second row. Its single-column `目录` uses one rounded frame, a non-scrolling title and Expand/Collapse row, and the standard fixed-height internally scrolling entries window on desktop and mobile. A− and A+ now apply an important inline size together with the shared reader variable, so both reading text and Contents resize despite the book’s legacy important font rules. Existing reader-controlled bookmarks are imported into the shared Book Mark window. Popup overlays remain transparent, popup panels remain opaque and movable, and Chinese note titles use `註释`. Follow-up corrections on the same date added complete document-level mobile width containment and a mobile PCED header guard: the rendered header height is captured before the page lock, the header remains fixed above the popup while it is open, popup opening and dragging stay below it, and the header returns to its normal sticky state after closing. Both root elements are viewport-bounded, the header clips accidental row overflow, reading containers can shrink and genuinely wide tables remain inside their own scrollers. On 12 September 2026, its cover alone adopted the Daily Chants English cover-card standard: warm cream gradient, light brown border, 14 px rounded corners, soft shadow, and a left cover/right information layout on desktop and mobile. Its approved 1180 px wider-reader container was not changed. The established side-by-side Pāli–Chinese reading body, book wording, cover image, front matter, paragraph alignment, footnotes and PCED data were preserved. The correction is source-validated and awaits deployed physical-device confirmation.
- `daily-chants-burmese.html` was brought into source-level conformity on 11 September 2026. Its final Burmese screen header is present in the initial HTML in the required order: logo, book name, `မာတိကာ`, A−, A+, one `စာညှပ်`, Search field and Search button. The desktop header is fixed and non-wrapping; the complete mobile header is one sticky two-row unit with Search on the second row and document-level width containment. Separate Save/Go bookmark buttons, the former Last Read control and automatic last-read tracking were removed. The reader is a standard-width book rather than one of the documented two-column exceptions, so its desktop page is centred at a maximum of 1080 px with at least 14 px side clearance. Its Burmese-only Contents title remains above the standard fixed-height internally scrolling list, and font controls resize both Contents and reading text. Primary `h2` book headings use the approved centred pale panel and top rule shown by Mindfulness of Breathing; subordinate `h3` headings use the left-aligned divider treatment. Source-faithful illustrated and Mahānamakkāra title layouts are preserved. Footnote and Book Mark overlays remain transparent, their panels remain opaque, and popup movement support is retained. Book wording, images, source pages, paragraph order and footnotes were not changed. Source validation passes; deployed physical-device confirmation remains pending.
- `daily-chants.html` was brought into source-level conformity on 12 September 2026. Its final English header is present in the initial HTML, with Contents and English navigation, A−, A+, one Book Mark control and Search in the approved order. The desktop header is fixed and non-wrapping; the complete mobile header is one sticky two-row unit with Search on the second row and document-level width containment. Previously Read and automatic last-read tracking are retired. Its approved wider 1500 px desktop reading width and two-column Pāli–English body are preserved. Its `Content` panel uses one rounded frame, a fixed Collapse/Expand title row and a one-column internally scrolling entries window at the standard desktop and mobile heights. A 12 September follow-up first set `column-count: 1`, but deployed evidence showed that a fixed-height CSS multi-column container still generated overflow columns to the right. The corrected implementation disables CSS multi-column layout entirely with `columns: initial` and uses normal full-width block flow, so excess entries continue vertically inside the scrolling window without a horizontal scrollbar. The same safeguard is present in the initial HTML for first paint. The separate `Pāli | English` label row is removed, and sutta-name rows use the centred pale heading treatment now documented for Chanting Books other than Daily Chants Burmese. Book wording, translations, cover, paragraph order, Contents destinations, footnotes and PCED data were preserved. Source validation passes; deployed physical-device confirmation remains pending.
- On 12 September 2026, the standard cover-card and desktop-width rules were rolled out to every other reader HTML in the repository, including reader files not currently linked from `index.html`. The targeted final stylesheet gives every affected cover the Daily Chants English cream gradient, border, 14 px corners, shadow, balanced padding and cover-left/information-right layout on desktop and mobile. The named wider readers and the archival Burmese Chanting Book copy retain their existing approved wider desktop widths. Daily Chants Burmese, Dhammapada, Mindfulness of Breathing, The Buddha's Twelve Kinds of Evil Retribution, The Only Way for the Realization of Nibbāna, The Requisites of Enlightenment and 止观法要 use the centred 1080 px standard-width classification on desktop. Daily Chants English and Paṭisambhidāmagga already met their approved cover and width requirements and were therefore not restyled in this rollout. Book wording, translations, covers, credits, metadata, paragraph order, reading columns, footnotes, PCED data and reader logic were not changed. Source validation passes; deployed desktop and physical-mobile confirmation remains pending.
- `paccayaniddeso.html` and `paccayaniddeso-chinese.html` were brought into source-level screen-header and Contents-page conformity on 12 September 2026. Both retain their approved wider 1500 px desktop container and side-by-side Pāli/translation reading body. Their final fixed desktop and complete sticky two-row mobile headers use the required order, with English before 中文, font controls before one reader-controlled Book Mark / 书签 control, and Search on the mobile second row. Their desktop header now uses the Daily Chants English visual standard, including its full-width spacing, logo tile and 40 px rounded controls; responsive compaction retains every control where multiple language buttons must fit. Reader / 阅读 remains hidden for legacy compatibility. Previously Read / 上次阅读 and automatic scroll/unload tracking are retired; deliberately saved legacy bookmarks can be imported into the shared Book Mark window. English uses the exact panel title `Content` and Chinese uses `目录`; each has one outer frame, a non-scrolling Collapse/Expand row and one normal-flow vertical Contents column inside the standard fixed-height scrolling window. Main text follows continuously below. The Paccayuddesa enumeration of the 24 conditions uses one vertical column on desktop and mobile in both editions; this does not change the later four-part Paccayaniddesa analytical layout. On mobile analysis cards, the `Paccayuddesa` block is omitted only when that cell is empty; nonblank `Paccayuddesa` cells remain visible. Existing book wording, translations, cover images, Contents entries and targets, paragraph order, footnotes, PCED data, Search and passage-preserving language navigation were preserved. Source validation passes; deployed desktop and physical-mobile confirmation remains pending.

- On 15 September 2026, both `patisambhidamagga.html` and `patisambhidamagga-chinese.html` were audited against the Chinese Word source for font fidelity. Chinese canonical body text and quotations use Songti; Introduction narrative uses Kaiti; translator explanations use FangSong; source Hei/Xihei/Zhongsong/title-Song roles are retained where present; Aṭṭhakathā notes default to Kaiti; and converted Unicode Pāli uses Times New Roman with a Unicode serif fallback. The parallel reader's former blanket important font override was removed and restricted to interface chrome, and footnote popups now retain the source note role. The full-Chinese generator records source-derived paragraph and note font classes and reuses verified run-level semantics for mixed-font Introduction notes. Sangayana and VriRomanPali source encodings remain converted to Unicode rather than being exposed in HTML. Text, stanza grouping, edition switching, Contents, Search, bookmarks and PCED behavior are unchanged.
- `samanera-sikkhapadani.html` was created from the complete supplied revised-edition Word source on 22 September 2026. Its actual cover, copyright notice and opening quotation precede a fixed-height scrolling Contents panel with no printed page numbers. All twelve chapters, glossary, references, two source tables, twenty-six body illustrations and 157 Word footnotes are included. Chinese source font roles and paragraph indentation are retained; Word `start/end` and `left/right` indentation attributes are both recognized, and a Chinese run must use its East Asian font even when its Latin font metadata names Sangayana. All numeric body lists use a compact, consistent hanging indent without artificial inter-item gaps. Sangayana Pāli is Unicode, uses Times New Roman and is clickable for PCED. Chapter 2 pairs the source Pāli with the corresponding source Chinese pronunciation guidance and Chinese meaning without adding English. Chapter 10 presents its longer Pāli recitations, suttas and their source Chinese meanings as 43 matched parallel rows, stacking each pair on mobile. Former printed page turns do not divide the flow. Every note reference is a superscript linked to a movable, non-dimming `註释` popup using the approved 《止观法要》 colour treatment. The book is listed under the Mahinda `戒律 The Code of Monastic Discipline` subcategory beside 《比库巴帝摩卡》 and uses the current 1080px reader width with responsive two-column-to-single-column behavior. Source, link, asset, note and JavaScript syntax checks pass; deployed browser interaction confirmation remains pending.

## 14. Applying this standard in a future chat

Use this instruction:

> Improve `<book filename>` to conform to `BOOK-READER-INTERFACE-STANDARD.md`. Use `dhammapada-pali-chinese.html` as the approved implementation example and `daily-chants-burmese.html` as the mobile sticky-header and Contents-window behaviour reference. Change only the interface items required by the standard; preserve all book content and unrelated features. Test against the acceptance checklist and update the implementation status before opening a pull request.
