# Converting a legacy Burmese PDF to a Unicode HTML book

This guide records the workflow used for the 87-page *Ānāpāna & Vipassanā* PDF in Dhamma Books. It is a procedure for similar books, **not** a universal character map: the font encoding, text order, and layout must be checked for each new PDF. The resulting reader remains a proofing draft until its wording has been compared with the visible source pages.

## 1. Inventory and preserve the source

1. Keep an untouched copy of the PDF and record its page count, dimensions, metadata, embedded fonts, and whether text can be selected. Note any mixed font runs, scanned pages, two-page spreads, and pages with images or tables.
2. Render representative pages to images: cover, Contents, opening quotations, plain prose, bold and centred passages, footnotes, numerals and references, and pages near the end. Inspect the full book for exceptional layouts.
3. Identify the actual font used by each text span (`page.get_text('dict')` in PyMuPDF gives text, font, size, flags, and bounding box). A font's name alone does not establish the character encoding. Keep the original PDF available alongside the HTML for proofing.
4. If text is an image rather than extractable, add OCR and page-by-page proofreading as a separate step. A converter for embedded legacy text will not recover scans.

## 2. Extract with coordinates and font provenance

Save one structured record per page and line, including page number, page size, coordinates, and each span's **original text and font**. The example implementation is `work/extract_pdf.py`, producing `work/pages-raw.json`.

The example PDF simulates some bold text by drawing the same glyphs several times with tiny offsets. Group near-identical lines by baseline and coordinates, and remove true duplicate overprints while retaining independently positioned text. Check the rendered page before discarding overlapping fragments; repeated words in the source are not automatically extraction duplicates. Reconstruct reading order explicitly for columns or facing pages.

## 3. Determine legacy glyph mappings from evidence

1. For every embedded legacy font, inspect its character map and render a glyph chart using the corresponding supplied `.ttf` where available. Match **the glyph that appears on the PDF page** to the extracted code point, then to its intended Unicode Burmese character or sequence. Keep mappings separate per font; do not apply one font's table to every span.
2. A converter such as Burglish can provide an initial pass; test the output against actual glyphs. The example used `tmp/winresearcher.js` plus explicit exceptions in `work/convert_pdf.js`. One important correction was the source glyph represented by `ç`, which means Burmese punctuation `၊` in this book. An incorrect generic mapping had affected many lines.
3. Convert only spans in the legacy font. Preserve already-Unicode Burmese, Latin references, punctuation, and numerals according to their source context. Apply font-specific substitutions first, then normalization and documented correction rules; store the raw and converted span together.
4. Check complex stacks and mark order, especially `္`, `ျ/ြ/ွ/ှ`, `ေ`, `ိ/ီ/ု/ူ`, `ံ`, `့`, `း`, `ဿ`, `ဉ/ည`, and Pāli conjuncts. Unicode NFC alone does not prove that a cluster is correct. Verify visually against the PDF at the same passage.
5. Treat `၀` (Burmese zero), `ဝ` (letter wa), ASCII `0`, and references with mixed Latin/Burmese digits as different things. **Do not globally replace digits or number-like letters.** Inspect the PDF and neighbouring citations, decide on a consistent citation-number policy, and proof every exceptional number. Similarly, do not infer a character from visual resemblance alone.

Save a conversion audit listing unmapped glyphs, suspicious sequences, changed numeric tokens, and representative source/Unicode pairs. Zero unmapped glyphs is a useful automated check, not proof of textual correctness.

## 4. Rebuild the book's structure from the PDF

Compare the printed Contents with the actual section headings; create HTML anchors for every heading and test each destination. Suppress repeated running heads, page numbers, and page-turn breaks, but preserve the actual text and front matter.

Use paragraph flow for ordinary prose: combine consecutive PDF lines into one paragraph so HTML wraps naturally at any screen width. Start a new paragraph at a genuine source paragraph break, inset, stanza, heading, or substantial vertical gap. Carry the source's first-line or block indentation into CSS. **Do not add a paragraph at every printed line end.** Conversely, keep verse lines separate where the line breaks carry meaning. Record how line spacing, stanza spacing, right alignment, centred lines, and source bold spans were identified. Render opening boxed quotations with the same grouping, emphasis, and border arrangement shown in the PDF; check every such box, including the first.

Build the interface from the current `BOOK-READER-INTERFACE-STANDARD.md` and an approved Burmese reader. Keep the author and category correct, use the specified Contents subheading style, make text controls affect the whole reading body, and preserve search/bookmark/read-aloud behaviour as appropriate. For the example book, the cover comes from **only the right half of the PDF's first page**; crop and inspect the exported image and use a new asset filename if a published cover is being replaced, to avoid a stale cached image.

The example scripts `work/build_book.py` and `work/convert_pdf.js` contain book-specific page numbers, exceptions, heading matches, and CSS. Use them as reference implementations; change those assumptions for each new source rather than running them unchanged.

## 5. Proof every page before publication

| Check | What to verify |
| --- | --- |
| Text | Compare each HTML passage with its rendered PDF page, particularly mixed fonts, bold words, Pāli, damaged extractions, and visibly odd clusters. Have a competent Burmese reader review wording. |
| Numerals | Compare citations, years, enumerations, page references, and Burmese digits against the PDF; distinguish zero from wa and check punctuation after numbers. |
| Layout | Check paragraph continuity, real indents, centred and right-aligned passages, source bold, boxed stanzas, line spacing, cover crop, tables, notes, and image order. |
| Completeness | Account for all source pages and book text; compare section order and Contents links; inspect start, middle, end, and every exceptional page. |
| Unicode | Search for leftover legacy Latin glyphs, replacement characters, broken combining-mark sequences, repeated painted text, and unsupported font fallback. |
| Reader | Test desktop and phone widths, resizing, search, Contents navigation, bookmarks, read-aloud if present, and every linked asset. |

Generate an issue log with PDF page, screenshot or quoted short passage, HTML location, correction, and verification status. Fix a mapping at its root and recheck **all** occurrences; apply isolated textual corrections only with source evidence. After regenerating, verify that corrected markup and cover assets reached the final delivery package. A structural script can report coverage and unresolved glyphs, but **it cannot certify word-by-word fidelity**. Keep the source-PDF comparison link and mark the edition as a draft until the full visual/text proof is complete.

## Reusable handoff prompt

> Convert the attached Burmese PDF into a Unicode HTML book using `LEGACY-BURMESE-PDF-TO-HTML-GUIDE.md` and the current `BOOK-READER-INTERFACE-STANDARD.md`. First identify each embedded font and verify glyph mappings against rendered pages. Preserve all wording, source emphasis, meaningful verse line breaks, paragraph indents, centred passages, and boxed stanzas; reflow ordinary prose across screen sizes. Check numerals and citations individually. Compare the final HTML against every PDF page and provide a page-by-page proofing report with any unresolved readings. Deliver only the amended repository files and supporting assets.
