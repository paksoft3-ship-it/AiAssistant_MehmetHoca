# IMPLEMENTATION PLAN — EidosUs

_Updated at the end of every phase. Source of truth for sequencing._

## Status legend
✅ done · 🔄 in progress · ⏳ pending

---

## Phase 0 — Audit & baseline ✅
- Extract single workspace from duplicate ZIPs; archive the zips. ✅
- `npm install`, `npm run lint`, `npm run build` (all pass; no test script). ✅
- Write `CURRENT_STATE_AUDIT.md`, `ARCHITECTURE.md`, `IMPLEMENTATION_PLAN.md`, `KNOWN_LIMITATIONS.md`, `DATA_MODEL.md`, `PRIVACY_AND_DATA_FLOW.md`, `MANUAL_TEST_CHECKLIST.md`, `CHANGELOG.md`. ✅
- Initialize git, baseline commit (no secrets/build output/large docs). ✅

## Phase 1 — Architecture & persistence 🔄
- Add `config/product.ts` (brand = EidosUs) and `config/featureFlags.ts`.
- Add local parser deps `pdfjs-dist`, `mammoth`; configure PDF.js worker for Vite; remove CDN `<script>` tags from `index.html`.
- Define the new domain types (`AcademicDocument`, `DocumentPage`, `TextSegment`, `SourceAnchor`, `ReadingAnchor`, `ResearchNote`, …) alongside legacy `types.ts` with adapters.
- Add Dexie database (`db/database.ts`) + repositories (documents, notes, …).
- Implement one-time non-destructive localStorage→IndexedDB migration + a Settings reset/recovery action.
- Introduce Vitest + first unit tests (language normalization, voice ranking, migration, anchor serialization).
- Begin incremental extraction of helpers from `App.tsx` / `useSpeechEngine.ts` (no behavior change).

## Phase 2 — Core source-linked note workflow ⏳
- Exact text selection in the reader → `SourceAnchor` (selectedText + page + segmentId + context + offsets).
- Fallback to active spoken segment when nothing is selected.
- `ResearchNote` with raw/cleaned/final fields; note editor with source excerpt card.
- Jump-to-source with temporary highlight; notes search/tags/sort.

## Phase 3 — AI note cleaning ⏳
- `POST /api/ai/clean-note` with Zod-validated structured JSON `{cleanedNote, suggestedTags, warnings}`.
- Cleaned-note UI; raw transcript never overwritten; graceful fallback when AI unavailable.

## Phase 4 — Export ⏳
- Markdown + DOCX (`docx` npm) + improved TXT; export options; sanitized filenames; `ExportRecord`; export tests.

## Phase 5 — Reader & library polish ⏳
- Reader 3-pane desktop / tabbed mobile; search + progress; library filters/sorting; reliable TTS + dictation states.

## Phase 6 — Secondary features cleanup ⏳
- Modularize translation + discussion; **safe** figure explanation (no fabricated trends) behind a flag; remove misleading AI/voice claims; remove fake virtual voices and duplicate speed options.

## Phase 7 — Landing, privacy & beta readiness ⏳
- Landing page (`/`), waitlist (local/isolated), in-app privacy notice, "Verilerimi Sil", consistent error states, manual browser test pass.

## Phase 8 — Optional auth/cloud ⏳
- Supabase auth behind a flag; cloud repository implementing the same interface. Not an MVP blocker.

---

## Change log of plan deviations
- _(none yet)_
