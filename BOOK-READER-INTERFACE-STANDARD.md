# Dhamma-Books Reader Interface Standard

**Status:** Approved standard for every current and future reader book in `PAMCSG/Dhamma-Books`  
**Approved reference implementation:** `dhammapada-pali-chinese.html`  
**Behaviour reference:** `daily-chants-burmese.html`  
**Last consolidated:** 11 September 2026

This is the normative interface standard for improving an existing book or adding a new book. Apply it one book at a time. Do not change book wording, translations, paragraph order, images, tables, footnotes, PCED data or unrelated styling merely to make the interface conform.

## 1. Required shared assets

Every reader book must load the current versions of:

- `dhamma-books-reader-standard.css`
- `dhamma-books-reader-standard.js`

When a shared asset changes, update its versioned URL in each affected HTML file so deployed browsers do not reuse an older cached copy.

The final header structure must be present in the initial HTML and styled correctly on the first paint. JavaScript may enhance the existing controls, but it must not briefly show an old or duplicate header and replace it after loading. There must be no old-header flash when first entering a book.

## 2. Screen header

### Control order and alignment

Use this exact left-to-right sequence:

1. Logo
2. Book name
3. Contents button
4. Language button or buttons, when the book has more than one language
5. A−
6. A+
7. Book Mark
8. Search field
9. Search button

All controls, fields and rows are left-justified. Do not use a flexible spacer to push some controls to the right.

Labels must follow the active book language. For example, Chinese books use Chinese control labels and Burmese books use Burmese control labels. Language buttons appear only when applicable.

### Desktop

- Keep the complete header fixed at the top while the book scrolls.
- Keep every item in one non-wrapping row.
- Do not allow the header row to scroll sideways.

### Mobile

Follow the behaviour of Pāli Chanting Burmese and Daily Chants Burmese:

- The complete header is one sticky unit and remains at the top while the book scrolls.
- The first row contains the logo, book name, Contents, language buttons when applicable, A−, A+ and Book Mark.
- The second row contains the Search field followed by the Search button.
- The two rows stay together; the first row must never scroll away while only the Search row remains visible.
- The Search row occupies the available viewport width without extending beyond it.
- The page, header and book body must not slide left or right during normal unzoomed one-finger scrolling.
- Preserve native two-finger pinch-to-zoom. Do not use `user-scalable=no`, a restrictive `maximum-scale`, or touch rules that disable zooming.

Use `overflow-x: clip` or an equivalent layout-width correction at the document level so accidental horizontal layout overflow does not create a competing scroll container or break sticky positioning. Tables or other genuinely wide components may have their own contained horizontal scroller, but must not widen the whole page.

### Header appearance

| Element | Standard |
| --- | --- |
| Background | `#A8734F` |
| Text | White |
| Font family | `Arial`, `Microsoft YaHei`, `PingFang SC`, `Noto Sans CJK SC`, `Noto Sans SC`, `Noto Sans Myanmar`, `Myanmar Text`, `sans-serif` |
| Title font size | 18 px desktop; 16 px mobile |
| Control font size | 14 px desktop; 12 px mobile |
| Search input and placeholder | At least 15 px on mobile |

Use this same shared font stack for every wording in the screen header, including the book name, Contents, language labels, A−, A+, Book Mark, Search input and Search button. Apply it with equal priority to native `<button>` controls and button-like `<a>` links so, for example, a linked Contents control cannot retain a different legacy font. The book name and button labels are bold; Search input text and its placeholder are regular weight. Do not allow book-specific fonts to override the shared header font.

Centre every button label and every button-like header link both vertically and horizontally. Implement this on the control itself with flex alignment (`align-items: center` and `justify-content: center`), centred text and a consistent line height; do not rely on unequal padding to make a label appear centred.

Controls must remain large enough to tap. Compact mobile spacing is permitted only when the controls remain legible and functional.

## 3. Font-size controls

- A− and A+ must work with touch as well as mouse input.
- Each press must visibly resize the active book text.
- They must also resize the Contents heading, Contents entries and Contents page numbers.
- Do not hard-code descendant font sizes in a way that prevents them from following the book's font-size setting.
- Preserve the selected size consistently while the reader remains in use, according to the book's established storage behaviour.

## 4. Contents panel

Use Daily Chants Burmese as the structural reference.

### Structure

- Use one rounded outer frame only.
- Do not place a second frame around the list or around individual Contents groups.
- Put the Contents title row outside and above the scrolling entries window.
- The title row must never cover an entry as the Contents list scrolls.
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
| Muted text and page numbers | `#7B685A` |

Keep each book's existing Contents-entry fonts, hierarchy, colours and styling. Apart from the title row, fixed scrolling window and removal of inner frames, do not restyle the actual entries merely for standardisation.

### Columns and reading flow

- Every book uses one Contents column on desktop and mobile, including books in the Chanting Book 念诵本 category.
- Main text follows the Contents panel continuously on the same page.
- Contents links land below the sticky/fixed screen header so the destination heading remains visible.

## 5. Book cover

- Display the cover on the left and the title/edition information on the right on both desktop and mobile.
- Do not centre the cover above the text on mobile.
- Reduce the cover width and spacing responsively so the side-by-side arrangement fits the viewport.
- Allow the information column to shrink and wrap naturally; it must not force horizontal page movement.
- Preserve the original cover image, wording, credits and metadata.

## 6. Search

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

`pced-popup-standard.js` supplies the shared movement implementation and watches existing and dynamically created popup panels. A reader that does not otherwise load the PCED popup script must bootstrap its movement-only support through `dhamma-books-reader-standard.js`; this currently covers Daily Chants Burmese without changing its documented layout exception.

Constrain a moved popup so enough of its title bar remains visible to move or close it. On mobile, do not let dragging cover the complete fixed/sticky book header. Reopening the popup clears its dragged coordinates and restores that popup type's documented default position. Shared movement must not alter popup content, stacking, internal scrolling or close behaviour.

### Popup stacking

Every Dhamma-Books popup participates in one shared last-opened-on-top stack. Whenever a PCED, footnote, bookmark, Nissaya or other supported book-specific popup opens—or is reopened with newly selected content—it must move above every popup that is already open. Do not assign a popup type a permanently higher layer than another popup type.

Nested depth is unrestricted. For example, Dhammapada must support Nissaya → footnote → PCED with PCED on top. Closing the top popup removes only that popup from the stack and reveals every earlier popup in its existing position and state. Preserve independent opener highlights, movement, internal scrolling, transparent-overlay rules and default opening positions. Apply the active layer as an inline important value so old book-specific `z-index` declarations cannot override the shared order.

### Popup background

Every popup overlay in every Dhamma-Books reader must be transparent. Opening PCED, footnote, bookmark, Nissaya or another supported popup must not dim, shade or obscure the reading text behind it. The popup panel itself remains opaque and readable, with its established border and shadow. Preserve the popup's close controls, outside-click behaviour, movement, stacking and internal scrolling.

### Footnote popup wording

Use `註释`, not `注释`, as the title of a Chinese footnote popup. This terminology rule changes the popup title only; do not rewrite ordinary book text containing `注释`.

### Dhammapada nested popups

`dhammapada-pali-chinese.html` has a book-specific Nissaya/依词释 popup. Its default position is one normal body-text line below the complete rendered screen header on desktop and mobile. Measure the actual header height and body-text line height rather than assuming a fixed offset. Long Nissaya content scrolls internally within the remaining dynamic viewport space, and the popup remains movable.

When a reader selects a footnote superscript inside an open Nissaya popup, the footnote popup must appear above the Nissaya popup. Closing the footnote leaves the Nissaya popup open. If a Pāli word in that footnote is then selected, PCED opens above both earlier popups according to the shared popup-stacking standard.

In Dhammapada, preserve the established transparent PCED, footnote, bookmark and Nissaya overlays together with their opaque panels, close controls, outside-click behaviour, internal scrolling and movement.

While a Dhammapada PCED, footnote or Nissaya popup is open, keep the exact word, footnote superscript or Nissaya button that opened it visibly highlighted in the underlying reading surface. Remove that highlight when its popup closes. Nested popup highlights are independent: opening a footnote from Nissaya keeps the Nissaya trigger highlighted, adds a highlight to the selected footnote superscript, and removes only the footnote highlight when the footnote closes. The highlight must not change book wording, PCED matching or normal search highlighting, and this opener-highlight rule is currently Dhammapada-specific.

### Dhammapada Contents navigation

The 37 Dhammapada Contents links retain their existing unique fragment targets. Handle their navigation explicitly so the selected target is aligned 10 px below the measured complete screen header. During the first navigation after entering the book, recheck that alignment while fonts and any preceding embedded images finish loading and while the initial page height settles. Stop automatic realignment after five seconds or immediately when the reader deliberately scrolls or touches outside another Contents link. Preserve the selected URL fragment. This stability correction is Dhammapada-specific and must not change another book's Contents navigation.

## 7. Book Mark

- Provide one Book Mark header button, not duplicate legacy bookmark controls.
- The bookmark window supports add, list, go and delete, with bookmarks stored separately for each book.
- Do not provide a Last Position, Last Read, Previously Read or equivalent automatic-return control in any book.
- Do not run background scroll tracking solely to maintain an automatic last-read position.
- Book Mark destinations and Contents targets must be offset below the complete header rather than hidden behind it.

## 8. Language editions

- A multilingual book displays only the language buttons that actually exist.
- Put Chinese first where Chinese and English buttons are paired.
- Switching languages should return to the corresponding passage or nearest shared heading, using semantic section identifiers rather than raw page percentages.
- Header labels, Search feedback and bookmark actions follow the active language.

## 9. Non-regression requirements

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

## 10. Mandatory full-conformance procedure and acceptance checklist

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
- [ ] Contents height matches the standard.
- [ ] Main text follows Contents continuously.
- [ ] Contents targets and restored positions are not hidden behind the header.
- [ ] Inline scripts compile and no existing reader feature regresses.
- [ ] Only the intended book interface and documentation changed.

## 11. Implementation status

- `dhammapada-pali-chinese.html` is the approved reference implementation. Its former `上次阅读` control and automatic scroll/unload position tracking were removed on 11 September 2026. Book Mark continues to determine the current position only when the reader deliberately saves a bookmark.
- `the-buddhas-twelve-kinds-of-evil-retribution.html` was brought into full conformity on 11 September 2026. Its final header is present in the initial HTML: fixed and non-wrapping on desktop, and one complete sticky two-row unit on mobile with Search on the second row. The book-specific header rules keep its established `书签` and Search controls visible after shared reader enhancement on both screen sizes, and the mobile first row reserves enough space for the complete Chinese book name. It has no Last Position, Last Read or Previously Read control and performs no automatic last-read scroll tracking. Its one-column Contents uses the standard fixed-height internal scrolling window on desktop and mobile beneath a non-scrolling title row. Search, reader-controlled Book Mark, font controls, transparent popup overlays and current shared popup behavior are preserved. Its book content, cover, illustrations, body design, headings, Pāli treatment, footnotes and PCED integration were not changed.
- `zhiguan-fayao.html` was brought into full conformity on 11 September 2026. Its final fixed desktop header and complete two-row sticky mobile header are present in the initial HTML, and its book-specific visibility rules keep the established `书签` and Search controls visible after shared reader enhancement on both screen sizes. It has no Last Position, Last Read or Previously Read control and performs no automatic last-read scroll tracking; manual Book Mark saving determines the current position only when the reader chooses to save it. Its collapsible fixed-height one-column Contents window, font controls and popup integration follow this standard. Its PCED, footnote and bookmark popups use the shared mobile positioning, movement, last-opened-on-top and transparent-overlay behavior; Chinese footnote titles use `註释`. Its book content, cover, body hierarchy, Pāli treatment, footnotes and PCED data were preserved.
- `mindfulness-of-breathing.html` was brought into conformity on 11 September 2026. Its bilingual English/Chinese reader uses the fixed desktop and complete two-row mobile header, with Chinese listed before English, one Book Mark control and active-language Search. It has no Last Position, Last Read or Previously Read control and performs no automatic last-read scroll tracking. The final header and both one-column Contents structures are present in the initial HTML, so neither a legacy header nor a temporary layout can flash before JavaScript enhancement. Both English and Chinese Contents entries scroll inside the standard fixed-height window on desktop and mobile beneath a non-scrolling title row. Its PCED, footnote and bookmark popups use the shared below-header positioning, movement, internal scrolling and last-opened-on-top behavior. Book content, covers, language correspondence, headings, Pāli treatment, footnotes and PCED data were preserved.
- `the-requisites-of-enlightenment.html` was brought into conformity on 11 September 2026. Its bilingual English/Chinese reader places the final header structure in the initial HTML, with Chinese before English, one Book Mark control, active-language Search and no automatic last-read control or tracking. The desktop header is fixed in one non-wrapping row; the complete mobile header stays together as a sticky two-row unit, with Search on the second row. Its English `Content` and Chinese `目录` panels each use one rounded frame, a non-scrolling Expand/Collapse title row and the standard fixed-height one-column entries window on desktop and mobile. Existing legacy bookmark data is imported into the shared Book Mark window without deleting the old stored value. PCED, footnote and bookmark overlays remain transparent, their panels remain opaque, and Chinese footnote titles use `註释`. Book wording, translations, covers, paragraph order, headings, Pāli treatment, footnotes and PCED data were preserved.
- `patisambhidamagga.html` was brought into conformity on 11 September 2026. Its final Chinese screen header is present in the initial HTML in the required order, with one Book Mark control, Search and no `上次阅读` or automatic last-read tracking. The desktop header is fixed and non-wrapping; the complete mobile header is one sticky two-row unit with Search on the second row. Its single-column `目录` uses one rounded frame, a non-scrolling title and Expand/Collapse row, and the standard fixed-height internally scrolling entries window on desktop and mobile. Existing reader-controlled bookmarks are imported into the shared Book Mark window. Popup overlays remain transparent, popup panels remain opaque and movable, and Chinese note titles use `註释`. Follow-up corrections on the same date added complete document-level mobile width containment and a mobile PCED header guard: the rendered header height is captured before the page lock, the header remains fixed above the popup while it is open, popup opening and dragging stay below it, and the header returns to its normal sticky state after closing. Both root elements are viewport-bounded, the header clips accidental row overflow, reading containers can shrink, genuinely wide tables remain inside their own scrollers, and the cover remains on the left beside its information. The established side-by-side Pāli–Chinese reading body, book wording, cover image, front matter, paragraph alignment, footnotes and PCED data were preserved. The correction is source-validated and awaits deployed physical-device confirmation.

## 12. Applying this standard in a future chat

Use this instruction:

> Improve `<book filename>` to conform to `BOOK-READER-INTERFACE-STANDARD.md`. Use `dhammapada-pali-chinese.html` as the approved implementation example and `daily-chants-burmese.html` as the mobile sticky-header and Contents-window behaviour reference. Change only the interface items required by the standard; preserve all book content and unrelated features. Test against the acceptance checklist and update the implementation status before opening a pull request.
