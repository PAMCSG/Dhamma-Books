# Chinese-Tipitaka approved terminology feed

## Batch import dialog layout

- The action row in the **批量导入词句** dialog remains visible at the bottom while the dialog content scrolls, so **确认导入** cannot move outside the screen.
- On narrow/mobile screens, the dialog fits within the dynamic viewport and its action buttons wrap to accessible rows.

This is a one-time addition to `PAMCSG/Chinese-tipitaka`.

Upload `functions/api/approved-terms.js` using the same path. Do not replace `index.html` or other files.

The endpoint reads only non-deleted database rows whose status is `已确认` or `规范`. Each public record exposes `id`, `pali`, `chinese`, `type`, `source`, `page`, and `status`. The `source` and `page` fields allow Dhamma-Books and Tipitaka-reader to display each approved Chinese meaning together with its 出处. The consumers refresh this terminology quietly in the background.

The Chinese-Tipitaka Cloudflare Pages project must retain its existing D1 binding named `DB` pointing to `chinese-tipitaka-db`.

## PCED popup consumer rules

- Use this feed only for exact or verified whole-word Pāli matches during a single-word lookup.
- Omit sentence records from the single-word Chinese-Tipiṭaka group.
- Place matches under the popup language heading `中文`.
- Combine multiple meanings inside one unshaded bordered group headed `《汉译巴利三藏》玛欣德尊者和译藏团队`.
- Show each Chinese meaning with its `出处` inline beside it, combining `source` and `page` when available; do not repeat the language heading or team subheader.
- The reader and book repositories remain responsible for popup presentation and movement.

## Current handoff checkpoint — 6 September 2026

The feed update is committed as [`6b87e86`](https://github.com/PAMCSG/Chinese-tipitaka/commit/6b87e865ec64445d02c2187b4aa323c3b91ae490). Static integration tests passed. Final live visual verification must be performed in an authenticated Cloudflare Access session.

## Consumer data preservation

Book-side snapshots and caches must preserve `type`, `source`, and `page` when normalizing API records. Dropping these fields prevents the popup from rendering `出处`. On 6 September 2026, both book repositories advanced their approved-term cache to version 2 and enriched 244 bundled fallback records from this repository's authoritative standard and seed records.
When duplicate Pāli/Chinese records are merged, consumers must retain non-empty provenance field-by-field; an empty live `source` or `page` must not overwrite a populated bundled value. This is required for inflected lookups such as `Gotamo → Gotama → 果德玛`.

## Generic source fallback

For approved terms whose database record has no `source`, book snapshots may derive a citation from `source-data.js`. Accept exact Pāli token matches directly. Accept an inflected token only through the shared verified inflection rules and only when the aligned Chinese text agrees with the term's Chinese wording. Preserve an existing non-empty database or standard-record source in preference to a derived citation.

The 6 September 2026 snapshot indexed 559 aligned records and 14,884 exact or verified-inflection forms, adding conservative provenance to 344 previously source-less terms. For example, `purohito → purohita` is cited to `巴利三藏 > 经藏 > 长部 > 戒蕴品 > 《古德丹德经》，134`.

## Final centralized publication rule — 6 September 2026 (master v1.11)

- **发布词库更新** publishes every non-deleted record to the centralized versioned snapshot, including `待核对`, `规范`, `已确认`, and `有异译`. Deleted records are excluded.
- The **PCED Dictionary** in Dhamma-Books and Tipitaka-reader shows only matching non-deleted single-word records whose status is exactly `规范` or `已确认`.
- Tipitaka-reader's separate **汉译巴利三藏** tab shows every related matching non-deleted record, regardless of status. It must never show unrelated rows.
- AI terminology priority uses only `规范` and `已确认`.
- Status and internal page data remain in the snapshot but are not displayed. The popup displays the database's actual `出处` and hides the numeric internal page.
- Source precedence is: latest validated publication, previous validated browser cache, then bundled fallback. An older bundled or inferred source must never merge into or override a newer published record.
- The 2,207-record publication at `2026-09-06T06:42:11.667Z` succeeded, but the consumer feed was intercepted by Cloudflare Access. The read-only GET/OPTIONS feed must be reachable by both book sites while editor and POST publication access remain protected.
- Regression cases: `accayena` and `uppādo → uppāda` must both display the actual current database source `巴汉翻译语料库`; `evaṃvaṇṇo` must render independently of PCED headword success; every new word popup opens on PCED Dictionary at scroll position zero.

## Standard-file import and rollback — 7 September 2026

- **批量导入词句**（原“导入规范词句”）reads `状态` from the uploaded Excel/CSV/Word table. Supported values are `待核对`, `规范`, `已确认`, and `有异译`.
- If a file has no status column, or an individual row is blank, the proofreader chooses the fallback status in the import screen; the default is `待核对`.
- Excel uploads may include a `修改者` column. Its value is stored row by row in `records.modified_by`; a missing column or blank cell falls back to the authenticated user. Audit history `changed_by` and batch `imported_by` continue to record the authenticated user rather than the file-provided display value.
- An unfamiliar nonblank status blocks confirmation and must never be silently converted to `规范`.
- Uploaded standard files are append-only. Every valid row is inserted as a new record; the importer must never modify, replace, merge, skip, or delete an existing database entry, even when both Pāli and Chinese are identical.
- Same-Pāli imports receive the next available `.1/.2/.3…` sub-number. Repeated rows inside the uploaded file are also retained independently.
- The preview shows the status distribution, reports every valid row under **预计新增**, and must always show **预计替换：0**.
- Every successful uploaded-standard batch stores its timestamp, file name, counts, actor, batch tag, and pre-change record history.
- **撤销上一次导入** applies only to the latest successful **导入规范词句** file batch: newly created rows are soft-deleted, replaced rows are restored from history, and manual changes, older imports, and automatic-match batches are left untouched. The action is previewed, confirmed, audited, and cannot be applied twice to the same batch.
- Soft-deleted rows retain their permanent `dbid` and visible `id`; every later import must treat both identifiers as reserved. Duplicate sub-number allocation skips identifiers held by deleted rows, preventing `records.id` unique-constraint failures after rollback and re-import.
- Rollback changes the database only. The proofreader must inspect the result and then use **检查发布内容 / 发布词库更新** when ready.

### Live verification and 《阿毗达摩讲要》 import checkpoint

- A database backup was exported before this work with 3,383 existing records: `汉译巴利三藏校稿-数据库导出-20260907.xlsx`.
- The previously imported combined batch was successfully reversed with **撤销上一次导入**. This confirmed that the rollback restored replaced rows and removed newly imported rows without reversing unrelated database work.
- The first re-import attempt exposed `UNIQUE constraint failed: records.id` because soft-deleted duplicate sub-numbers were still permanently reserved in D1. PR [#4](https://github.com/PAMCSG/Chinese-tipitaka/pull/4) fixed allocation so active and deleted IDs/`dbid` values are both reserved, while only active records participate in Pāli replacement matching.
- After that fix, the combined workbook `阿毗达摩讲要上中下集_规范词句合并导入表(1).xlsx` was previewed and imported, but the preview exposed a second design error: 120 rows were classified as replacements and overwrote existing records, including `巴汉翻译语料库`. That batch must not be treated as the accepted final import and requires rollback followed by **发布词库更新** to republish the restored database.
- The corrected append-only preview for this workbook must show 1,295 valid records, 1,295 expected additions, and 0 expected replacements. Its status distribution remains 1,212 `规范` and 83 `待核对`; same-Pāli rows may additionally be reported as the subset that will receive sub-numbers.
- The workbook contained 48 repeated-Pāli groups covering 101 rows. Repetition is intentional: identical Pāli + Chinese translations were merged, while genuinely different Chinese translations for the same Pāli remain separate entries.
- Combined provenance follows the fixed volume order 上、中、下; for example, a term found in the upper and lower volumes uses `《阿毗达摩讲要》上、下集`. Page references are stored in `查备注`, and the modifier is `YFL`.
- Append-only uploaded-standard import is the accepted continuation baseline. Before any future large import, export a fresh database backup and verify that the preview shows the expected total and status distribution with **预计替换：0** before confirmation.
