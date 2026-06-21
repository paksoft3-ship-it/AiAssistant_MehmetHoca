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

## Phase 1 — Architecture & persistence 🔄 (core done)
- ✅ Add `config/product.ts` (brand = EidosUs) and `config/featureFlags.ts`.
- ✅ Add local parser deps `pdfjs-dist`, `mammoth`; configure PDF.js worker for Vite (`?url`); remove CDN `<script>` tags from `index.html`.
- ✅ Define the new domain types (`AcademicDocument`, `DocumentPage`, `TextSegment`, `SourceAnchor`, `ReadingAnchor`, `ResearchNote`, …) alongside legacy `types.ts`.
- ✅ Add Dexie database (`db/database.ts`) + repositories (documents, notes).
- ✅ Implement one-time non-destructive localStorage→IndexedDB migration; run on startup (`main.tsx`).
- ✅ Introduce Vitest + first unit tests (parser pure fns, ids, migration mapping + IndexedDB roundtrip) — 27 passing.
- ✅ Add `lib/ids.ts`; update `.env.example`; rename package to `eidosus`.
- ⏳ Carry-over into Phase 2: Settings reset/recovery action (UI); wiring the reader/notes UI onto the repositories; further extraction of helpers from `App.tsx`/`useSpeechEngine.ts`. (Deferred deliberately so App is re-wired together with the new note workflow rather than half-migrated.)

## Phase 2 — Core source-linked note workflow ✅
- ✅ Exact text selection in the reader → `SourceAnchor` (selectedText + page + globalIndex + surrounding context).
- ✅ Fallback to active spoken segment when nothing is selected.
- ✅ `ResearchNote` with raw/cleaned/final fields; note editor (`NoteEditorModal`) with source excerpt card + tags.
- ✅ Jump-to-source; notes search / tag filter / sort (`ResearchNotesPanel`).
- ✅ Phase 1 carry-over: documents + notes wired onto IndexedDB repositories (`useLibrary`, `useResearchNotes`); "Verilerimi Sil" reset.
- Note: segment offsets (`startOffset`/`endOffset`) and `segmentId` resolution are not yet populated (globalIndex + selectedText carry the anchor); cleaned-note AI button lands in Phase 3; translation persistence deferred to Phase 6.

## Phase 3 — AI note cleaning ✅
- ✅ `POST /api/ai/clean-note` with Zod-validated `{cleanedNote, suggestedTags, warnings}`; testable service core.
- ✅ Modular `server/` (config, geminiClient, prompts, schemas, middleware, routes); model from config.
- ✅ Hardening: body-size limit, rate limiting, timeouts, consistent error codes, privacy-safe logging.
- ✅ Cleaned-note UI wired (`onRequestClean`); raw transcript never overwritten; graceful fallback; flag-gated.
- ✅ Trust fix (early): removed fabricated graph-trend fallback (honest message instead).

## Phase 4 — Export ✅
- ✅ Markdown + DOCX (`docx` npm, lazy-loaded) + TXT renderers; `ExportDialog` with options.
- ✅ Options: include raw/excerpts/tags, order by source/created, selected-notes-only.
- ✅ Sanitized filenames; `ExportRecord` persisted via `exportRepository`; 9 export tests.

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
