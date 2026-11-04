# The Workings of Kamma — conversion and reader verification

Converted on 4 November 2026 from `Workings of Kamma 2nd Rev Ed Text- pamc 201708.doc`. Edition: Second Revised Edition, 2017. Author: The Pa-Auk Tawya Sayadaw.

## Source handling

The original Word binary was opened and saved to DOCX using LibreOffice without editing the book. The converter reads Word XML, styles, relationships, tables, notes and media directly. The reader replaces the duplicated print title leaves and printed Contents with its cover card and 449 working section links. Publication/funding information is retained; page headers, footers, blank print spacers and pagination do not interrupt continuous text.

Source `∙` (U+2219) and `·` (U+00B7) separators inside Pāli are removed and adjacent word parts joined. Sentence punctuation, spaces between words, original case and diacritics remain. For example, `paṭicca∙samuppāda` becomes `paṭiccasamuppāda`. Source soft hyphens are removed. Legacy Symbol/Wingdings arrows and other symbols are represented by Unicode equivalents. White `x` print alignment spacers remain invisible and are omitted from speech.

The complete first page of `Workings of Kamma 2nd Rev Ed COVER - 2017.pdf` was rendered for the cover, without cropping. The same image is used in the home card and reader. All 15 body PNG illustrations are byte-identical to the DOCX media. The 66 distinct tables include the Word textbox table once, choosing one AlternateContent representation.

## Catalogue and interface

The book is the first card directly under “Books by The Most Venerable Pa-Auk Tawya Sayadawgyi 帕奥西亚多吉书籍” in `index.html`. Existing books and subcategory order are preserved. The card uses the established `book-main`, `book-cover-row single` and `book-info` structure.

The initial HTML contains the full standard header: logo/title, Contents, A−, A+, Read Aloud, Book Mark, Search field and Search button. There are no additional language buttons for this English edition. Desktop is fixed in one row; mobile is a complete sticky two-row header with Search on row two. The reader follows the standard 1080px maximum width, shared cream cover card and mobile cover-left layout. The “Content” panel has one frame, a fixed Expand/Collapse title row and an internally scrolling single-column list at the prescribed desktop/mobile heights. Text controls resize both Contents and prose.

Tahoma source prose, bold quotations, font roles, indentation and heading hierarchy are retained; Pāli uses italic Times New Roman, blue in prose and inherited heading colour. Main sections use the centred pale panel/brown top rule; subordinate headings use the simpler left-aligned divider. All 1,000 footnotes and 360 endnotes are preserved, with complete popup bodies and return references. Endnotes also appear in their six source groups. Shared bookmarks, Search, Read Aloud, PCED definitions and draggable transparent-overlay popups are integrated. PCED data is initialized before the shared popup and uses its maintained definitions and verified forms.

Search now measures matching text before hiding paragraphs, avoiding repeated full-book layout for this long reader. Its matching, highlighting and clearing semantics are unchanged. Only the new book references shared reader script version 1.3.21; existing reader URLs are preserved.

## Validation

- The complete normalized body matches the retained Word source exactly: 738,811 non-whitespace characters, including table and textbox text.
- 5,254 separately addressable prose paragraphs and every footnote/endnote body match the source after the requested separator/soft-hyphen normalization. Headings and tables are additionally covered by the complete-body comparison.
- All IDs are unique; every internal link, 449 Contents destinations and 1,360 note references resolves. All illustrations match source bytes.
- Chromium 153 passed at 1440px desktop and touch-emulated 320/360/412px mobile widths: header order/stickiness, cover position, horizontal containment, font controls, Contents expand/collapse and destination offsets, footnotes, transparent overlays, saved bookmarks, Search/clear, exact selected read-aloud start and close-to-pause, real PCED definitions, dictionary dragging and one-finger swipe containment. No page JavaScript errors occurred.
- Read Aloud was verified with deterministic simulated speech voices, including English/inline-Pāli routing. Audible playback and installed voices on the user's physical devices remain to be confirmed.
- JavaScript syntax checks pass. Physical-device confirmation and editorial proofreading remain pending; this is a source-verified conversion, not an editorial revision.

Machine-readable evidence: `workings-of-kamma-conversion.json`, `workings-of-kamma-source-verification.json`, `workings-of-kamma-browser-verification.json`.

## Reproduce

Use Python with `lxml` and LibreOffice to save the `.doc` as `.docx`, then run from the repository parent:

```sh
python Dhamma-Books/scripts/convert-workings-of-kamma.py source.docx Dhamma-Books
python Dhamma-Books/scripts/verify-workings-of-kamma.py source.docx Dhamma-Books
```

For the browser check, install Playwright, run from the repository root and optionally set `CHROMIUM_PATH` to an installed Chromium executable:

```sh
node tests/workings-of-kamma-browser.mjs
```

The amended-files ZIP contains only new or changed repository files; unchanged shared assets are already in the repository.

## Source SHA-256

- `Workings of Kamma 2nd Rev Ed Text- pamc 201708.doc`: `fbebdf07a71b3d5d33cde50367993ccb485d3a87b4c96ee42350d2ca3402d816`
- `Workings of Kamma 2nd Rev Ed COVER - 2017.pdf`: `6c99300ce57b32da0ea9304f6605a1c36c392c8122a79ca7ef16933616bfbeec`
