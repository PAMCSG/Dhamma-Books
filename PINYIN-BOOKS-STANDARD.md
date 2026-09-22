# Hanyu Pinyin Books — Publishing Standard

This document applies to every book listed under `menu-pinyinbooks.html`.

## 1. Menu and site identity

- The canonical menu filename is `menu-pinyinbooks.html`.
- The menu header must be copied from the current `index.html`, including the PAMC emblem, bilingual PAMC title, introduction and Pāli Lexicon search area.
- Do not replace the PAMC emblem with an author, translator or book logo.
- Keep the ordinary `index.html` unchanged unless a separate request explicitly asks for an index change.
- Each menu entry must use the book's own cover image and link directly to its reader HTML.
- Embed the cover image directly in both the menu HTML and reader HTML as a Base64 data URL. Do not require a separate cover-image file.

## 2. Chinese and Hanyu Pinyin

- Use the licensed 方正楷体拼音字库 webfonts in `fonts/FZKTPY01.woff2` through `fonts/FZKTPY06.woff2`.
- Pinyin must appear above its Chinese character, not as a separate line.
- Use the alternate font faces when required for polyphonic characters.
- The present font use is for private review. Obtain the appropriate font licence before making the book public.

## 3. Pāli text

- Convert Sangayana or other legacy-encoded Pāli to standard Unicode before adding it to HTML.
- Store and display the final Pāli as Unicode, preferably Unicode NFC.
- Do not depend on a legacy Sangayana font for the meaning of the text.
- Every Pāli word must use `Times New Roman`, appear in the standard blue lookup style and open the PCED popup when clicked or activated from the keyboard.
- In word-by-word Pāli–Chinese explanation chapters, all Latin-script words are Pāli unless explicitly identified otherwise; do not style them as English.

## 4. English text and translation source

- Display English text in `Times New Roman`, with `Times` and a generic serif as fallbacks.
- For matched Bhikkhupātimokkha passages, use Bhikkhu Brahmali's English translation from SuttaCentral and keep the source attribution visible.
- If no matching SuttaCentral translation is available, translate from the Chinese text into English and mark it as `data-source="translated-from-chinese"`.
- Do not describe Chinese-based translations, editorial notes, introductions or newly written working translations as SuttaCentral text.
- Retain source metadata such as `data-source="suttacentral"` and segment references where available.

## 5. Reader layout and text size

- Default book reading text: `36px`.
- Reader size controls: minimum `30px`, maximum `54px`, in `2px` steps.
- Chinese, Pāli and English parallel text must remain readable on desktop and stack cleanly on mobile.
- Use Times New Roman for all Pāli and English text.
- Use the specially widened `1540px` desktop reading area for parallel-text and two-column books, while retaining a responsive mobile width.
- The contents window must follow the book order and show the English title beside every Chinese title.
- Every visible chapter and section title must include its English translation. Explanatory notices must also include an English line.
- Short Pāli–Chinese labels introducing rules or procedures must use the standard title format, for example `Pubbakaraṇaṃ–4. 四种事前任务`.
- The reader's home/logo link must return to `menu-pinyinbooks.html`.

## 6. Required files for each book

- One reader HTML file.
- One real book-cover image, embedded directly in the menu and reader HTML, with meaningful alternative text.
- Any required webfonts in the `fonts/` directory.
- A menu card in `menu-pinyinbooks.html`.
- Visible translation/source credit inside the reader.

## 7. Checklist for adding a book

1. Confirm the book title, cover, author or translator credit, and private/public status.
2. Convert all legacy Pāli to Unicode and validate the result.
3. Apply the pinyin font so pronunciation appears above each Chinese character.
4. Apply Times New Roman to English text.
5. Record the exact English translation source and licence.
6. Add the book card without changing the PAMC header or the Pāli Lexicon search section.
7. Test the menu link, reader return link, cover, search, PCED popup (including inflected Pāli forms), bookmarks, contents panel and font-size controls.
8. Check desktop and mobile layouts before publication.
